import { useLoaderData } from "react-router";
import { loadUsers } from "../manifest";

import { DEFAULT_META } from "../meta";
import { AFrameScene } from "../components/AFrameScene";
import { HelmetMeta } from "../components/HelmetMeta";

export const loader = loadUsers;

export default function UsersPage() {
  const users = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  return (
    <article>
      <HelmetMeta meta={DEFAULT_META} />
      <header>
        <h1>
          <a href="/">poppenhuis</a> / 3D
        </h1>  </header>
      <AFrameScene users={users} />
    </article>
  );
}