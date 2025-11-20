export const dynamic = "force-dynamic"; // prevent prerender

import ClientHome from "./ClientHome"; // client component

export default function Page() {
  return <ClientHome />;
}
