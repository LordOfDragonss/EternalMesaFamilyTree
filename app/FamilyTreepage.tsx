// "use client";

// import Image from "next/image";
// import FamilyTree from "@/app/components/FamilyTree";

// import React, { useRef, useState } from "react";
// const nodes = [
//   { id: "1", name: "Anna", x: 0, y: 0 },
//   { id: "2", name: "Rexy", x: -200, y: 150 },
//   { id: "3", name: "Lion", x: 200, y: 150 },
//   { id: "4", name: "Mimi", x: -200, y: 300 },
// ];

// export default function Home() {
//   return <FamilyTree />
// }
// // const [pos, setPos] = useState({ x: 0, y: 0 });
// // const [zoom, setZoom] = useState(1);

// // const dragging = useRef(false);
// // const last = useRef({ x: 0, y: 0 });


// // function onMouseDown(e: React.MouseEvent) {
// //   if (!dragging.current) return;
// //   const dx = e.clientX - last.current.x;
// //   const dy = e.clientY - last.current.y;

// //   setPos((p) => ({
// //     x: p.x + dx,
// //     y: p.y + dy,
// //   }));
// //   last.current = { x: e.clientX, y: e.clientY };
// // }
// //   <div className="h-screen overflow-hidden bg-zinc-900">

// //     {/* Search bar here */}
// //     <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
// //       <input type="text" placeholder="Search Family Member" className="w-96 rounded-x1 bg-zinc 800 p-3 text-orange" />
// //     </div>
// //     {/* <div className="h-screen overflow-hidden">
// //             <div
// //         className="origin-center"
// //         style={{
// //           transform: `scale(${zoom})`
// //         }}
// //       /> */}

// //     <div className="flex h-full flex-col items-center justify-center gap-12">
// //       <div className="flex gap-12">
// //         <PersonCard name="Anna Mesa" />
// //         <PersonCard name="Marulo Jay" />
// //       </div>

// //       <div className="flex gap-12">
// //         <PersonCard name="Rexanne 'Rexy' Mesa" />
// //         <PersonCard name="León 'Lion' Kuwu" />
// //       </div>

// //       <div className="flex gap-12">
// //         <PersonCard name="Mimi Mesa" />
// //         <PersonCard name="Connor Lauglin" />
// //       </div>
// //     </div>
// //   </div>



// function PersonCard({ name }: { name: string }) {
//   return (
//     <div className="
//     w-48
//     rounded-2x1
//     border
//     border-zinc-700
//     bg-zinc-800
//     p-4
//     shadow-x1
//     transition-all
//     hover:scale-105
//     hover:border-orange-500
//     hover:shadow-lg
//     hover:shadow-orange-500/20">
//       <div className="h-16 w-16 rounded-full bg-zinc-600"></div>
//       <h2 className="mt-4 text-x1 text-white">{name}</h2>
//     </div>
//   )
// }
