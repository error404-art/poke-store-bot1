import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Servers from "@/pages/servers";
import ServerConfig from "@/pages/server-config";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/servers" component={Servers} />
      <Route path="/server/:id" component={ServerConfig} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
