import { useParams } from "react-router-dom";

export default function DettaglioCliente() {

  const { id } =
    useParams();

  const clienti =
    JSON.parse(
      localStorage.getItem(
        "clienti"
      )
    ) || [];

  const cliente =
    clienti.find(
      (c) =>
        String(c.id) === id
    );

  const archivio =
    JSON.parse(
      localStorage.getItem(
        "archivioPreventivi"
      )
    ) || [];

  const preventiviCliente =
    archivio.filter(
      (p) =>
        p.cliente ===
        cliente?.nome
    );

  const totaleLavori =
    preventiviCliente.reduce(
      (acc, item) =>
        acc + item.totale,
      0
    );

  if (!cliente) {

    return (

      <div className="min-h-screen flex items-center justify-center text-white bg-[#060816]">

        Cliente non trovato

      </div>

    );

  }

  return (

    <div className="min-h-screen px-5 pt-8 pb-32 text-white bg-[#060816]">

      <div className="mb-8">

        <h1 className="text-4xl font-black">

          {cliente.nome}

        </h1>

        <p className="text-slate-400 mt-2">

          Scheda cliente

        </p>

      </div>

      <div className="bg-white/5 border border-white/10 rounded-[30px] p-5 mb-8">

        <h2 className="text-2xl font-bold mb-4">

          Informazioni

        </h2>

        <div className="space-y-3">

          <p>

            📞 {cliente.telefono || "-"}

          </p>

          <p>

            ✉️ {cliente.email || "-"}

          </p>

        </div>

      </div>

      <div className="bg-gradient-to-r from-green-500 to-emerald-400 rounded-[30px] p-6 mb-8">

        <p className="text-lg opacity-90">

          Totale lavori

        </p>

        <h2 className="text-5xl font-black mt-2">

          € {totaleLavori}

        </h2>

      </div>

      <div>

        <h2 className="text-2xl font-bold mb-5">

          Preventivi Cliente

        </h2>

        <div className="space-y-4">

          {preventiviCliente.map(
            (preventivo) => (

              <div
                key={preventivo.id}
                className="bg-white/5 border border-white/10 rounded-[28px] p-5"
              >

                <div className="flex items-center justify-between">

                  <div>

                    <h3 className="text-xl font-bold">

                      {preventivo.numero}

                    </h3>

                    <p className="text-slate-400 mt-1">

                      {preventivo.data}

                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-sm text-slate-400">

                      {preventivo.stato}

                    </p>

                    <h2 className="text-2xl font-black mt-1">

                      € {preventivo.totale}

                    </h2>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      </div>

    </div>

  );

}