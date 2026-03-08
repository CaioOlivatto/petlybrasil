import { PawPrint } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <PawPrint className="mx-auto h-16 w-16 text-primary" strokeWidth={1.5} />
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          PetCare
        </h1>
        <p className="text-muted-foreground">
          Cuide bem dos seus bichinhos 🐾
        </p>
      </div>
    </div>
  );
};

export default Index;
