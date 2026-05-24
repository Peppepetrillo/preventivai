import {
  useState,
} from "react";

export default function Listino() {

  const [listino, setListino] =
    useState([

      {
        id: 1,
        nome: "Punto luce",
        prezzo: 40,
      },

      {
        id: 2,
        nome: "Punto TV",
        prezzo: 50,
      },

      {
        id: 3,
        nome: "Punto Ethernet",
        prezzo: 60,
      },

      {
        id: 4,
        nome: "Presa USB A+C",
        prezzo: 50,
      },

      {
        id: 5,
        nome: "Faretto",
        prezzo: 7,
      },

      {
        id: 6,
        nome: "Strip LED Beghelli",
        prezzo: 15,
      },

      {
        id: 7,
        nome: "Faretto emergenza",
        prezzo: 25,
      },

      {
        id: 8,
        nome: "Gateway Living Now",
        prezzo: 200,
      },

      {
        id: 9,
        nome: "Punto luce connesso",
        prezzo: 60,
      },

      {
        id: 10,
        nome: "Tapparella connessa",
        prezzo: 80,
      },

      {
        id: 11,
        nome: "Videocitofono Urmet WiFi",
        prezzo: 700,
      },

      {
        id: 12,
        nome: "Montaggio antenna",
        prezzo: 250,
      },

      {
        id: 13,
        nome: "Kit emergenza strip LED",
        prezzo: 100,
      },

      {
        id: 14,
        nome: "Allarme perimetrale",
        prezzo: 2000,
      },

      {
        id: 15,
        nome: "Quadro elettrico",
        prezzo: 700,
      },

    ]);

  function modificaPrezzo(
    id,
    nuovoPrezzo
  ) {

    const aggiornato =
      listino.map(
        (item) => {

          if (
            item.id === id
          ) {

            return {

              ...item,

              prezzo:
                nuovoPrezzo,

            };

          }

          return item;

        }
      );

    setListino(
      aggiornato
    );

    localStorage.setItem(
      "listino",
      JSON.stringify(
        aggiornato
      )
    );

  }

  return (

    <div className="min-h-screen bg-[#060816] text-white p-5">

      <h1 className="text-4xl font-black mb-8">

        Listino

      </h1>

      <div className="space-y-4">

        {listino.map((item) => (

          <div
            key={item.id}
            className="bg-white/5 rounded-3xl p-5 border border-white/10"
          >

            <div className="flex items-center justify-between gap-4">

              <h2 className="text-xl font-bold">

                {item.nome}

              </h2>

              <div className="flex items-center gap-3">

                <input
                  type="number"
                  value={item.prezzo}
                  onChange={(e) =>
                    modificaPrezzo(
                      item.id,
                      e.target.value
                    )
                  }
                  className="w-24 bg-black/20 border border-white/10 rounded-xl p-3 text-center outline-none"
                />

                <div className="text-2xl font-black">

                  €

                </div>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}