import { Container } from "@/components/layout/Container";
import { SkeletonLoader } from "@/components/news/SkeletonLoader";

export default function Loading() {
  return (
    <Container className="py-10">
      <div className="mb-8 h-8 w-64 animate-pulse rounded bg-neutral-200/70" />
      <SkeletonLoader count={9} />
    </Container>
  );
}
