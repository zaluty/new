import { OrganizationProfile } from "@clerk/nextjs";

export default function OrganizationPage({
  params,
}: {
  params: { orgName: string };
}) {
  return (
    <>
      <OrganizationProfile routing="hash" />
    </>
  );
}
