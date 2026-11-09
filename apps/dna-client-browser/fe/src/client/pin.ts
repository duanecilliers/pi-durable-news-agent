// Chat panes flow bottom up: newest last, pinned to the bottom unless the reader scrolls up more than 120 px. Feed
// panes (edge "top") flow top down: newest first, pinned to the top. Either way a button with the count of new items
// jumps back to the newest; away from it, the browser's scroll anchoring keeps the cards in view from moving.
import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";

export function usePinned(
  el: Ref<HTMLElement | undefined>,
  count: () => number,
  edge: "top" | "bottom" = "bottom",
) {
  const pinned = ref(true);
  const unseen = ref(0);
  const newest = () => (edge === "top" ? 0 : (el.value?.scrollHeight ?? 0));
  const bottom = () => el.value && (el.value.scrollTop = newest());
  const onScroll = () => {
    const e = el.value;
    if (!e) return;
    pinned.value =
      edge === "top" ? e.scrollTop <= 120 : e.scrollHeight - e.scrollTop - e.clientHeight <= 120;
    if (pinned.value) unseen.value = 0;
  };
  let observer: ResizeObserver | undefined;
  onMounted(() => {
    el.value?.addEventListener("scroll", onScroll, { passive: true });
    observer = new ResizeObserver(() => pinned.value && bottom());
    if (el.value?.firstElementChild) observer.observe(el.value.firstElementChild);
    void nextTick(bottom);
  });
  onBeforeUnmount(() => {
    el.value?.removeEventListener("scroll", onScroll);
    observer?.disconnect();
  });
  watch(count, async (n, old) => {
    await nextTick();
    if (pinned.value) bottom();
    else unseen.value += Math.max(0, n - (old ?? 0));
  });
  const jump = () => {
    unseen.value = 0;
    pinned.value = true;
    el.value?.scrollTo({ top: newest(), behavior: "smooth" });
  };
  return { pinned, unseen, jump };
}
