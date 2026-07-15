"use client";
import { useState } from "react";
import { db } from "../../lib/firebase"; 
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";

interface Paciente {
  id: string;
  apellido: string;
  nombres: string;
  documento: string;
  fechaNac: string;
  obraSocial: string;
}

interface Evolucion {
  id?: string;
  pacienteId: string;
  fecha: string;
  nota: string;
  profesional: string;
}

export default function HistoriaClinica() {
  const [dniBusqueda, setDniBusqueda] = useState("");
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [evoluciones, setEvoluciones] = useState<Evolucion[]>([]);
  const [nuevaNota, setNuevaNota] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Buscar paciente por DNI de forma segura
  const buscarPaciente = async () => {
    if (!dniBusqueda) return;
    setMensaje("Buscando...");
    setPaciente(null);
    setEvoluciones([]);

    try {
      // 1. Buscamos al paciente (asumiendo que los guardás en una colección "pacientes")
      // Si todavía no tenés la colección "pacientes" separada de "turnos", 
      // podemos buscar en "turnos" para extraer sus datos.
      const q = query(collection(db, "turnos"), where("documento", "==", dniBusqueda));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Tomamos el primer registro que coincida con el DNI
        const docData = querySnapshot.docs[0].data();
        const pacEncontrado = {
          id: querySnapshot.docs[0].id,
          apellido: docData.apellido,
          nombres: docData.nombres,
          documento: docData.documento,
          fechaNac: docData.fechaNac,
          obraSocial: docData.obraSocial
        };
        setPaciente(pacEncontrado);
        setMensaje("");
        
        // 2. Cargamos su historial de evoluciones
        cargarEvoluciones(docData.documento);
      } else {
        setMensaje("No se encontró ningún paciente con ese DNI.");
      }
    } catch (error) {
      setMensaje("Error al buscar.");
    }
  };

  const cargarEvoluciones = async (documentoDni: string) => {
    try {
      const qEvol = query(
        collection(db, "evoluciones"), 
        where("documentoPaciente", "==", documentoDni)
      );
      const snapshotEvol = await getDocs(qEvol);
      const listaEvol = snapshotEvol.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Evolucion[];
      
      // Ordenamos por fecha descendente (más nuevas primero)
      listaEvol.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setEvoluciones(listaEvol);
    } catch (error) {
      console.error("Error al cargar evoluciones", error);
    }
  };

  const guardarEvolucion = async () => {
    if (!paciente || !nuevaNota.trim()) return;

    const nuevaEvolucion = {
      documentoPaciente: paciente.documento,
      fecha: new Date().toISOString(),
      nota: nuevaNota,
      profesional: "Lic. Kinesiología" // Esto luego se puede automatizar con el login
    };

    try {
      await addDoc(collection(db, "evoluciones"), nuevaEvolucion);
      setNuevaNota(""); // Limpiamos el campo
      cargarEvoluciones(paciente.documento); // Recargamos la lista
      alert("¡Evolución guardada con éxito!");
    } catch (error) {
      alert("Error al guardar la evolución.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar - Mismo diseño que la agenda para mantener coherencia */}
      <aside className="w-64 bg-blue-800 text-white p-6 hidden md:block">
        <h2 className="text-2xl font-bold mb-8">DM KINESIO</h2>
        <nav className="space-y-2 mb-8">
          <a href="/agenda" className="block p-3 rounded-lg hover:bg-blue-700 transition">📅 Agenda</a>
          <a href="/pacientes" className="block p-3 bg-blue-900 rounded-lg font-bold border-l-4 border-white transition">📁 Historias Clínicas</a>
        </nav>
        <button className="w-full p-3 bg-red-500 rounded-lg font-bold">Cerrar Sesión</button>
      </aside>

      <main className="flex-1 p-8">
        <header className="mb-8 bg-white p-6 rounded-xl shadow-sm border flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Historia Clínica</h1>
            <p className="text-sm text-gray-500">Buscador de pacientes y registro de sesiones</p>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Ingresar DNI" 
              className="border-2 p-2 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500"
              value={dniBusqueda}
              onChange={(e) => setDniBusqueda(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarPaciente()}
            />
            <button 
              onClick={buscarPaciente}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
            >
              Buscar
            </button>
          </div>
        </header>

        {mensaje && <p className="text-center text-gray-500 mb-4">{mensaje}</p>}

        {paciente && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Ficha del Paciente (Solo lectura) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border lg:col-span-1 h-fit">
              <div className="flex items-center gap-4 mb-6 border-b pb-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                  {paciente.nombres.charAt(0)}{paciente.apellido.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{paciente.nombres} {paciente.apellido}</h2>
                  <p className="text-sm text-gray-500">DNI: {paciente.documento}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div><span className="text-xs font-bold text-gray-400 block">OBRA SOCIAL</span><span className="text-gray-800 font-medium">{paciente.obraSocial || "Particular"}</span></div>
                <div><span className="text-xs font-bold text-gray-400 block">FECHA NACIMIENTO</span><span className="text-gray-800 font-medium">{paciente.fechaNac}</span></div>
              </div>
            </div>

            {/* Panel de Evoluciones */}
            <div className="bg-white p-6 rounded-xl shadow-sm border lg:col-span-2 flex flex-col h-[600px]">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Registro de Sesiones</h3>
              
              {/* Nueva Evolución */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <textarea 
                  className="w-full border p-3 rounded-lg text-gray-900 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Escribir la evolución de la sesión de hoy..."
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                />
                <div className="flex justify-end">
                  <button 
                    onClick={guardarEvolucion}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
                  >
                    + Agregar Evolución
                  </button>
                </div>
              </div>

              {/* Historial Timeline */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {evoluciones.length === 0 ? (
                  <p className="text-center text-gray-400 mt-10 italic">No hay registros previos para este paciente.</p>
                ) : (
                  evoluciones.map((evol, index) => (
                    <div key={evol.id || index} className="border-l-4 border-blue-500 pl-4 py-2 relative">
                      <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[8px] top-4 border-2 border-white"></div>
                      <span className="text-xs font-bold text-gray-500">
                        {new Date(evol.fecha).toLocaleDateString('es-AR')} - {new Date(evol.fecha).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})} hs
                      </span>
                      <p className="text-gray-800 mt-1 whitespace-pre-wrap">{evol.nota}</p>
                      <span className="text-[10px] text-gray-400 block mt-2 font-semibold">Cargado por: {evol.profesional}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}