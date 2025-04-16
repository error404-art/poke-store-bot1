import { 
  Client, 
  GatewayIntentBits, 
  Events, 
  SlashCommandBuilder, 
  EmbedBuilder,
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  PermissionFlagsBits,
  Interaction,
  ModalSubmitInteraction,
  ButtonInteraction,
  CommandInteraction,
  TextChannel,
  ChatInputCommandInteraction,
  GuildMember,
  Role
} from 'discord.js';
import { storage } from './storage';
import { insertOrderSchema } from '@shared/schema';

// Initialize Discord client with necessary intents
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Register slash commands when the bot is ready
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user?.tag}!`);

  try {
    // Create the /sell command
    const sellCommand = new SlashCommandBuilder()
      .setName('sell')
      .setDescription('Displays store purchase embed message')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

    // Add /invite command to join the server
    const inviteCommand = new SlashCommandBuilder()
      .setName('invite')
      .setDescription('Obtén una invitación para unirte al servidor de PokeStore');

    // Register commands globally
    await client.application?.commands.set([sellCommand, inviteCommand]);
    console.log('Successfully registered application commands.');

    // Set bot presence to "Playing poke store la mejor tienda"
    client.user?.setPresence({
      activities: [{ name: 'poke store la mejor tienda', type: 0 }],
      status: 'online'
    });

    console.log('Bot presence set successfully.');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'sell') {
    await handleSellCommand(interaction);
  } else if (interaction.commandName === 'invite') {
    await handleInviteCommand(interaction);
  }
});

// Handler for the /invite command
async function handleInviteCommand(interaction: ChatInputCommandInteraction) {
  try {
    // Create embed with server information
    const embed = new EmbedBuilder()
      .setColor('#FEE75C')
      .setTitle('¡Únete a la comunidad de PokeStore!')
      .setDescription('La mejor tienda de PokeMMO con los mejores precios y productos.')
      .setThumbnail(interaction.client.user?.displayAvatarURL() || '')
      .addFields(
        { name: '¿Qué ofrecemos?', value: '• Pokémon competitivos\n• Items raros\n• Precios justos\n• Atención personalizada' },
        { name: 'Haz clic en el botón de abajo para unirte:', value: '\u200B' }
      )
      .setFooter({ text: '© poke store - la mejor tienda' });

    // Create button with the invite link
    const inviteButton = new ButtonBuilder()
      .setLabel('Unirse a PokeStore')
      .setURL('https://discord.gg/QdNT5EDUAP')
      .setStyle(ButtonStyle.Link);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(inviteButton);

    // Send the embed with the button
    await interaction.reply({ embeds: [embed], components: [actionRow] });

  } catch (error) {
    console.error('Error handling invite command:', error);
    await interaction.reply({ 
      content: 'Hubo un error al procesar el comando.', 
      ephemeral: true 
    });
  }
}

// Handle button interactions
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isButton()) return;

  const { customId } = interaction;

  if (customId === 'order') {
    await handleOrderButton(interaction);
  } else if (customId === 'continue') {
    await handleContinueButton(interaction);
  } else if (customId.startsWith('notify_')) {
    await handleNotifyButton(interaction);
  }
});

// Handle modal submissions
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === 'orderForm') {
    await handleOrderFormSubmit(interaction);
  }
});

// Handler for the /sell command
async function handleSellCommand(interaction: ChatInputCommandInteraction) {
  try {
    // Check if user has any of the allowed roles
    if (interaction.guildId) {
      const member = interaction.member as GuildMember;
      const allowedRoles = process.env.ALLOWED_ROLES?.split(',') || [];

      if (allowedRoles.length > 0) {
        const hasAllowedRole = member.roles.cache.some(role => allowedRoles.includes(role.id));

        if (!hasAllowedRole) {
          const roleNames = member.guild.roles.cache
            .filter(role => allowedRoles.includes(role.id))
            .map(role => role.name)
            .join(', ');
            
          await interaction.reply({ 
            content: `Solo usuarios con los roles ${roleNames} pueden usar este comando.`, 
            ephemeral: true 
          });
          return;
        }
      } else if (guildMember) {
        // Fallback to CEO role if no configuration exists
        const hasCEORole = guildMember.roles.cache.some((role: Role) => role.name === 'CEO');

        if (!hasCEORole) {
          await interaction.reply({ 
            content: 'Solo usuarios con el rol CEO pueden usar este comando.', 
            ephemeral: true 
          });
          return;
        }
      }
    }

    // Create the embed message
    const embed = new EmbedBuilder()
      .setColor('#FEE75C') // yellow color
      .setTitle('hola! 👋 Bienvenido al sistema de compra de la poke store')
      .setDescription('Al momento de comprar aceptas estos términos y condiciones:')
      .addFields(
        { name: '1.', value: 'No nos hacemos responsables por la crianza indebida' },
        { name: '2.', value: 'Ante cualquier estafa externo al servidor no nos hacemos cargo' },
        { name: '\u200B', value: 'Si estás de acuerdo dale click al botón de abajo' }
      )
      .setFooter({ text: '© poke store' });

    // Create the "encargar 📦" button
    const orderButton = new ButtonBuilder()
      .setCustomId('order')
      .setLabel('encargar 📦')
      .setStyle(ButtonStyle.Success);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(orderButton);

    // Send the embed with the button
    await interaction.reply({ embeds: [embed], components: [actionRow] });

    // Don't update server config here, only use it from the web panel
    // Keep existing configuration if there is one
    if (interaction.guildId) {
      const existingConfig = await storage.getServerConfig(interaction.guildId);
      if (!existingConfig) {
        // If there's no config yet, create a default one
        await storage.createOrUpdateServerConfig({
          guildId: interaction.guildId,
          orderChannelId: interaction.channelId,
          // Don't set a default required role
        });
      }
    }

  } catch (error) {
    console.error('Error handling sell command:', error);
    await interaction.reply({ 
      content: 'Hubo un error al procesar el comando.', 
      ephemeral: true 
    });
  }
}

// Handler for the "encargar 📦" button
async function handleOrderButton(interaction: ButtonInteraction) {
  try {
    // Create the "continuar" button for DM
    const continueButton = new ButtonBuilder()
      .setCustomId('continue')
      .setLabel('continuar')
      .setStyle(ButtonStyle.Success);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton);

    // Send DM to the user
    await interaction.user.send({
      content: `hola ${interaction.user.username}👋! Bienvenido al sistema de compra de la poke store, bien para comprar debes de rellenar un formulario para saber que desea comprar y a quien se lo mandaremos`,
      components: [actionRow]
    });

    // Reply to the button interaction
    await interaction.reply({ 
      content: 'Te he enviado un mensaje privado para continuar con tu pedido.', 
      ephemeral: true 
    });

  } catch (error) {
    console.error('Error handling order button:', error);
    await interaction.reply({ 
      content: 'No pude enviarte un mensaje privado. Por favor habilita los mensajes privados para continuar.', 
      ephemeral: true 
    });
  }
}

// Handler for the "continuar" button in DM
async function handleContinueButton(interaction: ButtonInteraction) {
  try {
    // Create modal form
    const modal = new ModalBuilder()
      .setCustomId('orderForm')
      .setTitle('Formulario de Compra');

    // Create form fields
    const discordInput = new TextInputBuilder()
      .setCustomId('discord')
      .setLabel('DISCORD')
      .setPlaceholder('Tu nombre de usuario de Discord')
      .setValue(interaction.user.tag)
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const characterInput = new TextInputBuilder()
      .setCustomId('character')
      .setLabel('Nombre de tu personaje de pokeMMO')
      .setPlaceholder('Ingresa el nombre de tu personaje')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const ageInput = new TextInputBuilder()
      .setCustomId('age')
      .setLabel('Edad')
      .setPlaceholder('Ingresa tu edad')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const productInput = new TextInputBuilder()
      .setCustomId('product')
      .setLabel('Producto que desea comprar')
      .setPlaceholder('Ej: Pokémon competitivo, Items, etc.')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const quantityInput = new TextInputBuilder()
      .setCustomId('quantity')
      .setLabel('Cantidad')
      .setPlaceholder('Ingresa la cantidad que deseas comprar')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    // Add fields to action rows
    const discordRow = new ActionRowBuilder<TextInputBuilder>().addComponents(discordInput);
    const characterRow = new ActionRowBuilder<TextInputBuilder>().addComponents(characterInput);
    const ageRow = new ActionRowBuilder<TextInputBuilder>().addComponents(ageInput);
    const productRow = new ActionRowBuilder<TextInputBuilder>().addComponents(productInput);
    const quantityRow = new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput);

    // Add action rows to modal
    modal.addComponents(discordRow, characterRow, ageRow, productRow, quantityRow);

    // Show the modal to the user
    await interaction.showModal(modal);

  } catch (error) {
    console.error('Error handling continue button:', error);
    await interaction.reply('Hubo un error al mostrar el formulario. Por favor intenta de nuevo.');
  }
}

// Handler for the form submission
async function handleOrderFormSubmit(interaction: ModalSubmitInteraction) {
  try {
    // Get form field values
    const discordUsername = interaction.fields.getTextInputValue('discord');
    const pokeMMOCharacter = interaction.fields.getTextInputValue('character');
    const age = parseInt(interaction.fields.getTextInputValue('age'), 10);
    const product = interaction.fields.getTextInputValue('product');
    const quantity = parseInt(interaction.fields.getTextInputValue('quantity'), 10);

    // Validate form data
    const orderData = {
      discordUserId: interaction.user.id,
      discordUsername,
      pokeMMOCharacter,
      age,
      product,
      quantity
    };

    // Save order to storage
    const order = await storage.createOrder(orderData);

    // Send confirmation to user
    await interaction.reply({
      content: 'Gracias por comprar en nuestra tienda! Te avisaremos cuando tengamos tu pedido (aproximadamente son 4 días de demora)'
    });

    // Get the notification channel from secrets
    const orderChannelId = process.env.ORDER_CHANNEL_ID;
    if (!orderChannelId) return;

    // Get the notification channel
    const channel = await client.channels.fetch(orderChannelId);
    if (!channel || !(channel instanceof TextChannel)) return;

    // Create notification embed
    const notificationEmbed = new EmbedBuilder()
      .setColor('#57F287') // green color
      .setTitle('Han realizado un encargo 🎉')
      .setDescription(`El usuario ${interaction.user.username} a solicitado un encargo. A continuación la información del pedido:`)
      .addFields(
        { name: 'Información del pedido:', value: '\u200B' },
        { name: 'Producto:', value: product },
        { name: 'Cantidad:', value: quantity.toString() },
        { name: 'Personaje de pokeMMO:', value: pokeMMOCharacter }
      )
      .setFooter({ text: 'Si el pedido está listo para ser entregado pulsa el botón de abajo para pedir un precio e informar' });

    // Create "Avisar 📢" button
    const notifyButton = new ButtonBuilder()
      .setCustomId(`notify_${order.id}`)
      .setLabel('Avisar 📢')
      .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(notifyButton);

    // Send notification to the channel
    try {
      await channel.send({ embeds: [notificationEmbed], components: [actionRow] });
      console.log(`Pedido enviado al canal de notificaciones: ${orderChannelId}`);
    } catch (error) {
      console.error(`Error al enviar notificación al canal ${orderChannelId}:`, error);
      // Si falla, intentar enviar al canal actual donde se hizo el pedido
      if (interaction.channel && interaction.channel instanceof TextChannel) {
        try {
          await interaction.channel.send({ 
            embeds: [notificationEmbed], 
            components: [actionRow] 
          });
          console.log("Pedido enviado al canal actual como fallback");
        } catch (channelError) {
          console.error("Error al enviar al canal fallback:", channelError);
        }
      }
    }

  } catch (error) {
    console.error('Error handling form submission:', error);
    await interaction.reply({
      content: 'Hubo un error al procesar tu pedido. Por favor intenta de nuevo.',
      ephemeral: true
    });
  }
}

// Handler for the "Avisar 📢" button
async function handleNotifyButton(interaction: ButtonInteraction) {
  try {
    // Extract order ID from button custom ID
    const orderId = interaction.customId.split('_')[1];
    if (!orderId) throw new Error('Order ID not found');

    // Get the order from storage
    const order = await storage.getOrder(parseInt(orderId, 10));
    if (!order) {
      await interaction.reply({
        content: 'No se encontró el pedido asociado a este botón.',
        ephemeral: true
      });
      return;
    }

    // Update order status
    await storage.updateOrderStatus(order.id, 'ready');

    // Reply to the button interaction
    await interaction.reply({
      content: `Has marcado el pedido de ${order.discordUsername} como listo para entregar. Se ha notificado al cliente.`,
      ephemeral: true
    });

    // Try to notify the customer via DM
    try {
      const user = await client.users.fetch(order.discordUserId);
      await user.send({
        content: `¡Buenas noticias! Tu pedido de ${order.quantity}x ${order.product} está listo para ser entregado. Por favor contacta a un administrador para coordinar la entrega.`
      });
    } catch (dmError) {
      console.error('Error sending DM to customer:', dmError);
      await interaction.followUp({
        content: 'No se pudo enviar un mensaje directo al cliente. Por favor contactarlo manualmente.',
        ephemeral: true
      });
    }

  } catch (error) {
    console.error('Error handling notify button:', error);
    await interaction.reply({
      content: 'Hubo un error al procesar la notificación. Por favor intenta de nuevo.',
      ephemeral: true
    });
  }
}

export function startBot(token: string) {
  // Login to Discord with the bot token
  client.login(token)
    .then(() => console.log('Bot logged in successfully'))
    .catch(error => console.error('Error logging in:', error));

  return client;
}

// Export the client for reference in other parts of the application
export { client };