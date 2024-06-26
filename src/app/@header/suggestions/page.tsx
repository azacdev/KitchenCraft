import { z } from "zod";
import { HeaderWithInput } from "../components";

export default async function Page(props: {
  params: { slug: string };
  searchParams: Record<string, string>;
}) {
  const promptParse = z.string().min(1).safeParse(props.searchParams["prompt"]);
  const prompt = promptParse.success ? promptParse.data : undefined;
  return <HeaderWithInput />;
}
