import { prisma } from "@/lib/prisma";
import DeleteButton from "@/app/components/DeleteButton";

export default async function ColonistsPage() {
    const colonists = await prisma.colonist.findMany({
        orderBy: {
            id: "asc",
        },
    });

    const months = [
        "Aprimay",
        "Jugust",
        "Septober",
        "Decembary",
    ];

    return (
        <main>
            <a className="btn" href="colonists\create">Add New Colonist</a>
            <h1>Colonists</h1>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>First Name</th>
                        <th>Nickname</th>
                        <th>Last Name</th>
                        <th>Gender</th>
                        <th>Birth Date</th>
                        <th>Death Date</th>
                        <th>Tools</th>
                    </tr>
                </thead>

                <tbody>
                    {colonists.map((colonist) => (
                        <tr key={colonist.id}>
                            <td>{colonist.id}</td>
                            <td>{colonist.firstName}</td>
                            <td>{colonist.nickname ?? "—"}</td>
                            <td>{colonist.lastName}</td>
                            <td>{colonist.gender}</td>


                            <td>
                                {colonist.birthYear &&
                                    colonist.birthMonth &&
                                    colonist.birthDay
                                    ? `${colonist.birthDay} ${months[colonist.birthMonth - 1]} ${colonist.birthYear}`
                                    : "Unknown"}
                            </td>

                            <td>
                                {colonist.deathYear &&
                                    colonist.deathMonth &&
                                    colonist.deathDay
                                    ? `${colonist.deathDay} ${months[colonist.deathMonth - 1]} ${colonist.deathYear}`
                                    : "—"}
                            </td>
                            <td>
                                <a className="btn" href={`/colonists/${colonist.id}`}>View</a>
                                {" | "}
                                <a className="btn" href={`/colonists/${colonist.id}/edit`}>Edit</a>
                                {" | "}
                                <DeleteButton
                                    action={`/api/colonists/${colonist.id}/delete`}
                                    colonistName={`${colonist.firstName} "${colonist.nickname}" ${colonist.lastName}`}
                                />
                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}