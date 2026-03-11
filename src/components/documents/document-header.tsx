import Image from "next/image"

export function DocumentHeader() {
  return (
    <div className="flex justify-between items-start border-b-2 border-primary pb-6 mb-8">
      <div className="flex flex-col">
        <h1 className="text-4xl font-black text-primary tracking-tighter leading-none mb-1">
          VMEDIA
        </h1>
        <h2 className="text-xl font-bold text-gray-800 tracking-widest leading-none">
          COMUNICACIONES
        </h2>
      </div>
      <div className="text-right">
        <div className="bg-primary text-white px-5 py-2 font-black rounded-sm mb-3 text-lg inline-block shadow-sm">
          DOCUMENTO OFICIAL
        </div>
        <div className="text-[10px] text-gray-500 space-y-0.5 leading-tight uppercase font-medium">
          <p>AV. Juarez #321 Int 8, col. centro</p>
          <p>Jiménez, Chihuahua, México C.P. 33980</p>
          <p className="font-bold text-gray-700">Tel: 629 688 15 51</p>
          <p className="text-primary font-black">www.vmediacomunicaciones.com</p>
        </div>
      </div>
    </div>
  )
}
