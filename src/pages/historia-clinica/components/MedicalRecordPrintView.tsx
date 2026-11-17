import { forwardRef } from 'react'
import { Stethoscope, PawPrint, Calendar, Phone, User, Award } from 'lucide-react'
import type {
  HistoriasClinicas,
  HistoriaSignosVitales,
  HistoriaDiagnosticos,
  HistoriaTratamientos,
  HistoriaRecetas,
  HistoriaExamenes,
} from '@/types/medical-record.types'
import type { MascotaConCliente } from '@/types/patient.types'

interface MedicalRecordPrintViewProps {
  historia: HistoriasClinicas
  mascota: MascotaConCliente | null
  signosVitales?: HistoriaSignosVitales | null
  diagnosticos?: HistoriaDiagnosticos[]
  tratamientos?: HistoriaTratamientos[]
  recetas?: HistoriaRecetas[]
  examenes?: HistoriaExamenes[]
  veterinarianName?: string
  clinicName?: string
  licenseNumber?: string
}

export const MedicalRecordPrintView = forwardRef<HTMLDivElement, MedicalRecordPrintViewProps>(
  (
    {
      historia,
      mascota,
      signosVitales,
      diagnosticos = [],
      tratamientos = [],
      recetas = [],
      examenes = [],
      veterinarianName = 'Médico Veterinario de Turno',
      clinicName = 'Clínica Veterinaria VetBol',
      licenseNumber,
    },
    ref
  ) => {
    const client = mascota?.cliente
    const ownerName = client ? `${client.nombres || ''} ${client.apellidos || ''}`.trim() : 'No registrado'
    const consultationDate = new Date(historia.fecha_consulta).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    return (
      <div
        ref={ref}
        id="medical-record-print-sheet"
        className="bg-white text-slate-900 p-8 max-w-4xl mx-auto space-y-6 font-sans border border-slate-200 rounded-xl shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none"
      >
        {/* Membrete Oficial */}
        <div className="flex items-start justify-between border-b-2 border-emerald-600 pb-4 print-avoid-break">
          <div className="space-y-1">
            <h1 className="text-xl font-black text-emerald-800 tracking-tight uppercase">
              {clinicName}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Expediente Clínico & Hoja de Atención Veterinaria (Estándar SOAP)
            </p>
            <p className="text-[11px] text-slate-400">
              Sistema de Información Médica Veterinaria Multi-Tenant • Bolivia
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 inline-block">
              {historia.numero_historia || `HC-#${historia.id_historia_clinica}`}
            </span>
            <span className="block text-[11px] text-slate-500 mt-1.5 font-medium">
              Estado: <strong className="text-emerald-700">{historia.estado || 'ABIERTA'}</strong>
            </span>
            <span className="block text-[11px] text-slate-400">
              {consultationDate}
            </span>
          </div>
        </div>

        {/* Ficha Paciente y Propietario */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs print-avoid-break">
          {/* Datos Paciente */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              <PawPrint className="w-3.5 h-3.5 text-emerald-600" />
              Datos del Paciente
            </div>
            <p className="text-sm font-black text-slate-900">
              {mascota?.nombre || 'Paciente sin nombre'}
            </p>
            <p className="text-slate-600">
              <strong className="text-slate-700">Especie/Raza:</strong> {mascota?.especie || 'N/A'} - {mascota?.raza || 'Mestizo'}
            </p>
            <p className="text-slate-600">
              <strong className="text-slate-700">Sexo/Edad:</strong> {mascota?.sexo || 'N/A'} • {mascota?.edad ? `${mascota.edad} años` : 'Edad no especificada'}
            </p>
            {signosVitales?.peso && (
              <p className="text-slate-600">
                <strong className="text-slate-700">Peso actual:</strong> {signosVitales.peso} kg
              </p>
            )}
          </div>

          {/* Datos Tutor */}
          <div className="space-y-1.5 border-l border-slate-200 pl-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              Tutor / Propietario
            </div>
            <p className="text-sm font-bold text-slate-900">{ownerName}</p>
            {client?.numero_ci && (
              <p className="text-slate-600">
                <strong className="text-slate-700">C.I.:</strong> {String(client.numero_ci)}
              </p>
            )}
            {client?.telefono && (
              <p className="text-slate-600">
                <strong className="text-slate-700">Teléfono:</strong> {String(client.telefono)}
              </p>
            )}
            {typeof client?.direccion === 'string' && (
              <p className="text-slate-600 truncate">
                <strong className="text-slate-700">Dirección:</strong> {client.direccion}
              </p>
            )}
          </div>
        </div>

        {/* Constantes Fisiológicas (Signos Vitales) */}
        {signosVitales && (
          <div className="space-y-2 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Constantes Fisiológicas (Exploración Clínica)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Peso</span>
                <span className="font-extrabold text-slate-900">{signosVitales.peso || '-'} kg</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Temperatura</span>
                <span className="font-extrabold text-slate-900">{signosVitales.temperatura || '-'} °C</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">F.C.</span>
                <span className="font-extrabold text-slate-900">{signosVitales.frecuencia_cardiaca || '-'} lpm</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">F.R.</span>
                <span className="font-extrabold text-slate-900">{signosVitales.frecuencia_respiratoria || '-'} rpm</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Mucosas</span>
                <span className="font-extrabold text-slate-900">{signosVitales.mucosas || '-'}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Condición</span>
                <span className="font-extrabold text-slate-900">{signosVitales.condicion_corporal ? `${signosVitales.condicion_corporal}/9` : '-'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Motivo y Anamnesis (S) */}
        <div className="space-y-3 print-avoid-break">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            2. Anamnesis & Motivo de Atención (S)
          </h3>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <p>
              <strong className="text-slate-800">Tipo de Consulta:</strong> {historia.tipo_consulta || 'Consulta General'}
            </p>
            <p>
              <strong className="text-slate-800">Motivo:</strong> {historia.motivo_consulta}
            </p>
            <p className="leading-relaxed">
              <strong className="text-slate-800">Historia previa (Anamnesis):</strong> {historia.anamnesis}
            </p>
            {historia.observaciones && (
              <p className="text-slate-500 italic">
                <strong>Observaciones:</strong> {historia.observaciones}
              </p>
            )}
          </div>
        </div>

        {/* Diagnósticos (A) */}
        <div className="space-y-2 print-avoid-break">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            3. Diagnósticos Clínicos (A)
          </h3>
          {diagnosticos.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Sin diagnósticos asentados.</p>
          ) : (
            <div className="space-y-1.5 text-xs">
              {diagnosticos.map((d, idx) => (
                <div key={d.id_diagnostico || idx} className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{idx + 1}. {d.diagnostico}</span>
                    {d.codigo_cie_vet && (
                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        CIE: {d.codigo_cie_vet}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-slate-500">{d.tipo_diagnostico}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {d.gravedad}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tratamientos y Procedimientos (P) */}
        {tratamientos.length > 0 && (
          <div className="space-y-2 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              4. Plan Terapéutico & Procedimientos en Clínica
            </h3>
            <div className="space-y-1.5 text-xs">
              {tratamientos.map((t, idx) => (
                <div key={t.id_tratamiento || idx} className="p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{t.tratamiento}</span>
                    {t.duracion_dias && (
                      <span className="text-[11px] text-slate-500 font-medium">{t.duracion_dias} días</span>
                    )}
                  </div>
                  {t.indicaciones && (
                    <p className="text-slate-600 text-[11px] leading-relaxed">{t.indicaciones}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exámenes Solicitados */}
        {examenes.length > 0 && (
          <div className="space-y-2 print-avoid-break">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              5. Exámenes Complementarios
            </h3>
            <div className="space-y-1.5 text-xs">
              {examenes.map((e, idx) => (
                <div key={e.id_examen || idx} className="p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{e.tipo_examen}</span>
                    <span className="text-[10px] text-slate-500">{e.laboratorio || 'Laboratorio'}</span>
                  </div>
                  {e.resultado && (
                    <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded leading-relaxed">
                      <strong>Resultado:</strong> {e.resultado}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receta Farmacológica Oficial (Hoja separable) */}
        {recetas.length > 0 && (
          <div className="border-t-2 border-dashed border-slate-300 pt-6 space-y-3 print-avoid-break">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                Receta Médica & Pautas de Dosificación
              </h2>
              <span className="text-[10px] text-slate-400 italic">Válida con firma y sello</span>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-2.5 border-b border-slate-200">Medicamento</th>
                  <th className="p-2.5 border-b border-slate-200">Dosis</th>
                  <th className="p-2.5 border-b border-slate-200">Frecuencia</th>
                  <th className="p-2.5 border-b border-slate-200">Vía</th>
                  <th className="p-2.5 border-b border-slate-200">Duración</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recetas.map((r, idx) => (
                  <tr key={r.id_receta || idx} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-900">{r.medicamento}</td>
                    <td className="p-2.5 font-mono font-semibold text-emerald-800">{r.dosis || '-'}</td>
                    <td className="p-2.5 text-slate-600">{r.frecuencia}</td>
                    <td className="p-2.5 text-slate-600">{r.via_administracion || 'Oral'}</td>
                    <td className="p-2.5 text-slate-600">{r.duracion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {recetas.some((r) => r.instrucciones) && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <strong className="block text-[11px] text-slate-700 uppercase">Indicaciones al tutor:</strong>
                {recetas
                  .filter((r) => r.instrucciones)
                  .map((r, i) => (
                    <p key={i} className="text-slate-600 leading-relaxed text-[11px]">
                      • <strong>{r.medicamento}:</strong> {r.instrucciones}
                    </p>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Firma del Veterinario */}
        <div className="pt-12 flex justify-end print-avoid-break">
          <div className="text-center w-64 border-t border-slate-400 pt-2 space-y-1">
            <p className="text-xs font-bold text-slate-900">{veterinarianName}</p>
            <p className="text-[11px] text-slate-500">Médico Veterinario Zootecnista</p>
            {licenseNumber && (
              <p className="text-[10px] text-slate-400 font-mono">Matrícula: {licenseNumber}</p>
            )}
          </div>
        </div>
      </div>
    )
  }
)

MedicalRecordPrintView.displayName = 'MedicalRecordPrintView'
