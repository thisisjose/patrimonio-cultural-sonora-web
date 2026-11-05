import { useState } from 'react';
import { festividades } from '../data/festividades';
import '../styles/pages/Festividades.css';

const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const formatoMes = new Intl.DateTimeFormat('es-MX', { month: 'long' });

function nombreMes(mes) {
  const nombre = formatoMes.format(new Date(2024, mes - 1, 1));
  return nombre.charAt(0).toLocaleUpperCase('es-MX') + nombre.slice(1);
}

function obtenerFestividadesDelDia(mes, dia) {
  return festividades.filter(
    (festividad) => festividad.mes === mes && festividad.dia === dia,
  );
}

function obtenerFestividadesDelMes(mes) {
  return festividades.filter(
    (festividad) => festividad.tipo === 'mes'
      && (festividad.mes === mes || festividad.meses?.includes(mes)),
  );
}

function formatoFecha(festividad) {
  const mesNombre = nombreMes(festividad.mes);

  if (festividad.tipo === 'rango') {
    const mesFin = festividad.mesFin
      ? nombreMes(festividad.mesFin)
      : mesNombre;
    return `${mesNombre} ${festividad.dia} – ${mesFin} ${festividad.diaFin}`;
  }

  return `${mesNombre} ${festividad.dia}`;
}

function FichaFestividad({ festividad, etiquetaPeriodo, periodo }) {
  return (
    <li className="festividades-item">
      <div className="festividades-item-details">
        <h3>{festividad.nombre}</h3>
        <p><strong>Municipio:</strong> {festividad.municipio}</p>
        <p><strong>{etiquetaPeriodo}:</strong> {periodo}</p>
      </div>
      {festividad.linkPatrimonio && (
        <a
          className="festividades-patrimonio-link"
          href={festividad.linkPatrimonio}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ficha de patrimonio: ${festividad.nombre}`}
        >
          Abrir ficha
        </a>
      )}
    </li>
  );
}

function FestividadesCalendario({ idPrefix = 'festividades' }) {
  const hoy = new Date();
  const [mesActual, setMesActual] = useState(hoy.getMonth());
  const [anioActual, setAnioActual] = useState(hoy.getFullYear());
  const [panel, setPanel] = useState(() => ({
    vista: obtenerFestividadesDelMes(hoy.getMonth() + 1).length ? 'mes' : 'fecha',
    dia: null,
  }));

  const numeroMes = mesActual + 1;
  const festividadesMes = obtenerFestividadesDelMes(numeroMes);
  const primerDiaSemana = (new Date(anioActual, mesActual, 1).getDay() + 6) % 7;
  const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
  const diasCalendario = [
    ...Array.from({ length: primerDiaSemana }, (_, indice) => ({
      clave: `vacio-${indice}`,
      vacio: true,
    })),
    ...Array.from({ length: diasEnMes }, (_, indice) => {
      const dia = indice + 1;
      return {
        clave: `${anioActual}-${numeroMes}-${dia}`,
        dia,
        festividades: obtenerFestividadesDelDia(numeroMes, dia),
      };
    }),
  ];
  const festividadesDia = panel.vista === 'fecha' && panel.dia
    ? obtenerFestividadesDelDia(numeroMes, panel.dia)
    : [];
  const monthId = `${idPrefix}-month`;
  const panelTitleId = `${idPrefix}-panel-title`;

  function cambiarMes(desplazamiento) {
    const nuevaFecha = new Date(anioActual, mesActual + desplazamiento, 1);
    setMesActual(nuevaFecha.getMonth());
    setAnioActual(nuevaFecha.getFullYear());
    setPanel({
      vista: obtenerFestividadesDelMes(nuevaFecha.getMonth() + 1).length ? 'mes' : 'fecha',
      dia: null,
    });
  }

  function mostrarFestividadesDelMes() {
    setPanel({ vista: 'mes', dia: null });
  }

  const tituloPanel = panel.vista === 'mes'
    ? `Festividades de ${nombreMes(numeroMes)}`
    : panel.dia
      ? `${nombreMes(numeroMes)} ${panel.dia}`
      : 'Consulta las festividades';

  return (
    <div className="festividades-layout">
      <section className="festividades-calendar" aria-labelledby={monthId}>
        <header className="festividades-calendar-header">
          <button
            className="festividades-month-arrow"
            type="button"
            onClick={() => cambiarMes(-1)}
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <button
            id={monthId}
            className="festividades-month-title"
            type="button"
            onClick={mostrarFestividadesDelMes}
            aria-label={`Consultar festividades sin día específico de ${nombreMes(numeroMes)}`}
          >
            {nombreMes(numeroMes)}
          </button>
          <button
            className="festividades-month-arrow"
            type="button"
            onClick={() => cambiarMes(1)}
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </header>

        <div className="festividades-calendar-grid" role="grid" aria-label="Calendario mensual">
          {diasSemana.map((dia) => (
            <span className="festividades-weekday" key={dia} role="columnheader">
              {dia}
            </span>
          ))}
          {diasCalendario.map((celda) => (
            celda.vacio
              ? <span className="festividades-empty-day" key={celda.clave} aria-hidden="true" />
              : (
                <button
                  className={[
                    'festividades-day',
                    celda.festividades.length ? 'has-festivity' : '',
                    panel.vista === 'fecha' && panel.dia === celda.dia ? 'is-selected' : '',
                    hoy.getFullYear() === anioActual
                      && hoy.getMonth() === mesActual
                      && hoy.getDate() === celda.dia ? 'is-today' : '',
                  ].filter(Boolean).join(' ')}
                  key={celda.clave}
                  type="button"
                  disabled={!celda.festividades.length}
                  aria-label={`${celda.dia}${celda.festividades.length ? `, ${celda.festividades.length} festividad${celda.festividades.length === 1 ? '' : 'es'}` : ''}`}
                  aria-pressed={panel.vista === 'fecha' && panel.dia === celda.dia}
                  onClick={() => setPanel({ vista: 'fecha', dia: celda.dia })}
                >
                  {celda.dia}
                  {celda.festividades.length > 0 && (
                    <span className="festividades-day-marker" aria-hidden="true" />
                  )}
                </button>
              )
          ))}
        </div>

        <div className="festividades-legend">
          <span><i className="festividades-legend-dot" aria-hidden="true" />Día con festividades</span>
          <span><i className="festividades-legend-today" aria-hidden="true" />Hoy</span>
        </div>
      </section>

      <section className="festividades-information" aria-labelledby={panelTitleId}>
        <header className="festividades-information-header">
          <p className="festividades-kicker">Festividades</p>
          <h2 id={panelTitleId}>{tituloPanel}</h2>
        </header>
        <div className="festividades-information-content" aria-live="polite">
          {panel.vista === 'mes' ? (
            <>
              {festividadesMes.length ? (
                <ul className="festividades-list">
                  {festividadesMes.map((festividad) => (
                    <FichaFestividad
                      key={festividad.id}
                      festividad={festividad}
                      etiquetaPeriodo="Periodo"
                      periodo={nombreMes(numeroMes)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="festividades-empty-message">
                  No hay festividades sin día específico registradas para este mes.
                </p>
              )}
            </>
          ) : festividadesDia.length ? (
            <ul className="festividades-list">
              {festividadesDia.map((festividad) => (
                <FichaFestividad
                  key={festividad.id}
                  festividad={festividad}
                  etiquetaPeriodo="Fecha"
                  periodo={formatoFecha(festividad)}
                />
              ))}
            </ul>
          ) : (
            <p className="festividades-empty-message">
              Selecciona un día marcado en el calendario para consultar sus festividades.
            </p>
          )}
        </div>
        {panel.vista === 'fecha' && festividadesMes.length > 0 && (
          <button
            type="button"
            className="festividades-unspecified-button"
            onClick={mostrarFestividadesDelMes}
          >
            Festividades sin día específico
          </button>
        )}
      </section>
    </div>
  );
}

export default FestividadesCalendario;
