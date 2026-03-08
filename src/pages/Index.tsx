import { useState } from "react";
import { Eye, EyeOff, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import petlyLogo from "@/assets/petly-logo.png";
import pawPattern from "@/assets/paw-pattern.png";

const Index = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-screen">
      {/* Left side - Login */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 relative"
        style={{ backgroundImage: `url(${pawPattern})`, backgroundSize: "300px", backgroundRepeat: "repeat" }}
      >
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center border-2 border-accent rounded-2xl p-8 bg-background/80 backdrop-blur-sm shadow-sm">
            <img src={petlyLogo} alt="Petly" className="h-28 w-28 object-contain" />
            <p className="text-muted-foreground text-sm mt-3">Cuidado inteligente para seu pet</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-background/70 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Senha</label>
                <button className="text-sm text-accent hover:underline">Esqueceu a senha?</button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-background/70 backdrop-blur-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button className="w-full h-12 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
              Entrar
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Não tem conta?{" "}
              <button className="text-accent font-medium hover:underline">Cadastre-se</button>
            </p>
            <p className="text-xs text-muted-foreground">
              Ao entrar, você concorda com nossos termos de uso e política de privacidade.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Hero */}
      <div
        className="hidden lg:flex flex-1 flex-col items-center justify-center px-12 text-primary-foreground"
        style={{ background: "var(--hero-gradient)" }}
      >
        <div className="max-w-lg space-y-8 text-center">
          {/* Icon */}
            <div className="mx-auto inline-flex items-center justify-center h-40 w-40 rounded-3xl bg-foreground/10 backdrop-blur-sm">
              <Heart className="h-20 w-20 text-primary" fill="hsl(var(--primary))" />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              Tudo que seu pet precisa, organizado com IA
            </h1>
            <p className="text-lg opacity-90">
              Gerencie consultas, vacinas, rotinas e receba orientações inteligentes para cuidar melhor do seu companheiro.
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              "Prontuário completo",
              "Alertas automáticos",
              "Diário do pet",
              "Orientações de IA",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
