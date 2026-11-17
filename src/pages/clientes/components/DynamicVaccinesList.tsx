import { Syringe, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { VaccineDraft } from '@/services/vaccines.service'

interface DynamicVaccinesListProps {
  vaccines: VaccineDraft[]
  onChange: (vaccines: VaccineDraft[]) => void
  disabled?: boolean
}

export function DynamicVaccinesList({
  vaccines,
  onChange,
  disabled = false,
}: DynamicVaccinesListProps) {
  const handleAddVaccine = () => {
    const today = new Date().toISOString().split('T')[0]
    onChange([
      ...vaccines,
      {
        nombre_vacuna: '',
        fecha: today,
        dosis: '1 ml',
        requiere_refuerzo: 'NO',
        frecuencia: '',
        descripcion: '',
        estado: 'APLICADA',
      },
    ])
  }

  const handleUpdateVaccine = (index: number, updates: Partial<VaccineDraft>) => {
    const updated = [...vaccines]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const handleRemoveVaccine = (index: number) => {
    const updated = vaccines.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Syringe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Historial de Vacunas Previas (Opcional)
            </h4>
            <p className="text-[11px] text-slate-500">
              Registra las vacunas con las que el paciente llega al momento del alta.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddVaccine}
          disabled={disabled}
          className="text-xs h-8 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar Vacuna
        </Button>
      </div>

      {/* Vaccine List or Empty State */}
      {vaccines.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
          <p className="text-xs text-slate-500">
            No se han añadido vacunas iniciales para esta mascota.
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Puedes añadir vacunas ahora o posteriormente desde la ficha médica.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {vaccines.map((vac, index) => {
            const needsRefuerzo = vac.requiere_refuerzo === 'SI'

            return (
              <div
                key={index}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 relative group"
              >
                {/* Header row with index and delete */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Registro de Vacuna
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveVaccine(index)}
                    disabled={disabled}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Eliminar vacuna"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Grid 1: Nombre de Vacuna y Fecha */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Nombre de la Vacuna *
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="EJ: SÉXTUPLE, RABIA, PUPPY"
                      value={vac.nombre_vacuna}
                      onChange={(e) =>
                        handleUpdateVaccine(index, {
                          nombre_vacuna: e.target.value.toUpperCase(),
                        })
                      }
                      disabled={disabled}
                      className="text-xs h-8 uppercase font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Fecha de Aplicación
                    </label>
                    <Input
                      type="date"
                      value={vac.fecha || ''}
                      onChange={(e) =>
                        handleUpdateVaccine(index, { fecha: e.target.value })
                      }
                      disabled={disabled}
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                {/* Grid 2: Dosis, Refuerzo y Frecuencia */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Dosis Aplicada
                    </label>
                    <Input
                      type="text"
                      placeholder="Ej: 1 ml"
                      value={vac.dosis || ''}
                      onChange={(e) =>
                        handleUpdateVaccine(index, { dosis: e.target.value })
                      }
                      disabled={disabled}
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      ¿Requiere Refuerzo?
                    </label>
                    <select
                      value={vac.requiere_refuerzo}
                      onChange={(e) =>
                        handleUpdateVaccine(index, {
                          requiere_refuerzo: e.target.value as 'SI' | 'NO',
                          frecuencia: e.target.value === 'NO' ? '' : vac.frecuencia,
                        })
                      }
                      disabled={disabled}
                      className="w-full h-8 px-3 rounded-md border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="NO">NO</option>
                      <option value="SI">SÍ</option>
                    </select>
                  </div>

                  {needsRefuerzo ? (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Frecuencia de Refuerzo *
                      </label>
                      <Input
                        type="text"
                        required={needsRefuerzo}
                        placeholder="Ej: Cada 21 días / Anual"
                        value={vac.frecuencia || ''}
                        onChange={(e) =>
                          handleUpdateVaccine(index, { frecuencia: e.target.value })
                        }
                        disabled={disabled}
                        className="text-xs h-8"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">
                        Frecuencia
                      </label>
                      <div className="h-8 px-3 rounded-md bg-slate-50 border border-slate-100 text-slate-400 text-xs flex items-center">
                        No aplica
                      </div>
                    </div>
                  )}
                </div>

                {/* Observaciones */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Observaciones / Lote / Fabricante (Opcional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Ej: Lote 4409B - Laboratorio Zoetis"
                    value={vac.descripcion || ''}
                    onChange={(e) =>
                      handleUpdateVaccine(index, { descripcion: e.target.value })
                    }
                    disabled={disabled}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
