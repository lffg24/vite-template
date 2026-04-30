// src/layout/PsicologoLayout.tsx
import { Outlet } from "react-router-dom";
import PsicologoSidebar from "@/features/psicosocial/components/PsicologoSidebar";
import { PsicoEmpresaActivaProvider } from "@/features/psicosocial/context/PsicoEmpresaActivaContext";

export default function PsicologoLayout() {
  return (
    <PsicoEmpresaActivaProvider>
      <div className="flex min-h-screen bg-slate-50">
        <PsicologoSidebar />
        <main className="min-w-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </PsicoEmpresaActivaProvider>
  );
}
