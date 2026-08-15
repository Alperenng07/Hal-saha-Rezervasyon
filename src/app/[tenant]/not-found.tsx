import { notFound } from "next/navigation";

type Props = { params: Promise<{ tenant: string }> };

export default function TenantNotFound(_props: Props) {
  notFound();
}
