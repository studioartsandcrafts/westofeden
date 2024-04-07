<script lang="ts">
  import Slider from "./Slider.svelte";
  import { slide } from "svelte/transition";
  import { blurOnEscape } from "./svelteDirectives";
  import { onMount } from "svelte";
  export let tracklist: Track[];
  interface Track {
    artist: string;
    title: string;
    coverArt?: string;
    src: string;
    links?: { [key: string]: string };
  }

  let currentIndex = -1;
  type Some<T> = T | null;
  let audioPlayer: HTMLAudioElement;
  let duration;
  let currentTime = 0;
  let paused = true; // <- do i need this

  let slider;

  let isPlaying = false;

  type Status =
    | "waiting"
    | "canplay"
    | "canplaythrough"
    | "seeking"
    | "playing";

  let status: Status = "waiting";
  $: currentTrack = tracklist[currentIndex >= 0 ? currentIndex : 0];

  function loadTrack(index: number) {
    currentIndex = index;
    audioPlayer.src = tracklist[currentIndex >= 0 ? currentIndex : 0].src;
    audioPlayer.load();
  }

  function pause() {
    isPlaying = false;
    audioPlayer.pause();
  }
  function play() {
    isPlaying = true;
    if (
      (status === "canplay" ||
        status === "canplaythrough" ||
        status === "waiting" ||
        status === "playing") &&
      paused
    )
      audioPlayer.play().catch(() => console.log("audio isnt loaded in yet!"));
  }
  function playPauseSong(index: number) {
    if (currentIndex !== index) {
      loadTrack(index);
      if (!isPlaying) play();
      return;
    }
    if (isPlaying) pause();
    else play();
  }

  function onCanPlay() {
    status = "canplay";
    if (isPlaying) audioPlayer.play();
  }

  function formatTime(seconds: number) {
    if (isNaN(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }

  let volume = 0.8;
  let volume2 = 80;
  $: volume = volume2 / 100; // lol this is sooo fucking jank

  onMount(() => {
    const isBrowser = typeof window !== "undefined";
    if (!isBrowser || !("volume" in localStorage)) return;
    const vol = localStorage.getItem("volume");
    if (!vol) return;
    volume2 = parseFloat(vol);
  });

  function saveVolume() {
    const isBrowser = typeof window !== "undefined";
    if (!isBrowser) return;
    localStorage.setItem("volume", Math.round(volume2).toString());
  }
</script>

<!-- svelte-ignore a11y-media-has-caption -->
<audio
  bind:this={audioPlayer}
  bind:duration
  bind:currentTime
  bind:paused
  bind:volume
  on:canplay={onCanPlay}
  on:canplaythrough={() => (status = "canplaythrough")}
  on:waiting={() => (status = "waiting")}
  on:timeupdate={() => (status = "playing")}
  on:seeking={() => (status = "seeking")}
  on:ended={() => {
    isPlaying = false;
    currentTime = 0;
  }}
  src={tracklist[currentIndex >= 0 ? currentIndex : 0].src}
/>
<noscript>
  <section>
    <p class="px-3 py-1 bg-yellow-300">
      Note: Music Player Requires Javascript to run!
    </p>
  </section>
</noscript>
<!--tracklist-->
{#each tracklist as track, index (track.src)}
  <section
    class="border-2 border-transparent"
    class:should-sticky={currentTrack.src === track.src && currentIndex !== -1}
  >
    {#if currentTrack.src === track.src && currentIndex !== -1}
      <div
        class="flex gap-3 items-center pt-1"
        transition:slide={{ duration: 300 }}
      >
        <span class="time">{formatTime(currentTime)}</span>

        <div class="flex-grow">
          <Slider
            bind:this={slider}
            min={0}
            bind:value={currentTime}
            max={duration}
            step={0.01}
            precision={2}
            formatter={(v) => formatTime(v)}
          />
        </div>

        <span class="duration">{formatTime(duration)}</span>
      </div>
    {/if}
    <div class="trackdetails">
      <div class="">
        <h2 class="font-serif italic text-2xl md:text-3xl">{track.title}</h2>
        <p class="text-sm md:text-base">{track.artist}</p>
      </div>
      <div class="flex flex-col items-end">
        <div class="flex gap-2">
          {#if currentTrack.src === track.src && currentIndex !== -1}
            <button
              class="volumebtn relative py-0 px-1 font-serif italic text-2xl"
              type="button"
              aria-label="volume"
              use:blurOnEscape
              on:focusout={saveVolume}
            >
              <svg
                fill="none"
                viewBox="0 0 38 34"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m24.213 12.943v7.5833m6-13.052v18.521m6-25.323v32.125m-34.235-21.335h6.4792l10.256-9.1368v29.819l-10.256-9.1371h-6.4789v-11.545z"
                  stroke="currentColor"
                  stroke-linejoin="bevel"
                  stroke-width="2.5"
                />
              </svg>
              <div
                class="volumebtn-inner py-1 absolute left-0 right-0 h-[6rem] top-[100%] border-b-2 border-x-2 border-fg bg-bg"
              >
                <Slider
                  min={0}
                  bind:value={volume2}
                  max={100}
                  step={1}
                  precision={1}
                  vertical
                  formatter={(v) => Math.round(v)}
                />
              </div>
            </button>
          {/if}

          <button
            class="playbtn font-serif italic text-2xl"
            type="button"
            on:click={() => playPauseSong(index)}
            disabled={currentTrack.src === track.src &&
              isPlaying &&
              (status === "canplay" ||
                status === "canplaythrough" ||
                status === "waiting")}
          >
            {#if currentTrack.src !== track.src}
              Play
            {:else if currentTrack.src === track.src && isPlaying && (status === "canplay" || status === "canplaythrough" || status === "waiting")}
              <span class="loader"></span>
              <!-- <span class="loader2 absolute"></span> -->
            {:else if currentTrack.src === track.src && isPlaying === true}
              Pause
            {:else if currentTrack.src === track.src && isPlaying === false}
              Play
            {/if}
          </button>
        </div>

        <div class="flex gap-4 mt-1">
          {#if "links" in track && track.links !== undefined}
            {#each Object.entries(track.links) as [name, href]}
              <a {href} target="_blank" class="link">{name}</a>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  </section>
{/each}

<style lang="postcss">
  .playbtn {
    @apply border rounded-full border-fg bg-white px-3 w-[3.2em] h-[1.5em] flex justify-center items-center;
    @apply hover:text-bg hover:bg-fg;
  }
  .playbtn:disabled {
    @apply opacity-85 pointer-events-none;
  }
  section {
    @apply px-4 max-w-xl mx-auto mb-2;
  }
  .trackdetails {
    @apply flex justify-between py-2 border-b-2 border-fg items-center;
  }
  .should-sticky {
    @apply sticky top-0 z-50 bg-white  border-fg;
  }
  .volumebtn {
    @apply border-t-2 border-x-2 border-transparent transition;
  }
  .volumebtn-inner {
    visibility: none;
    @apply -mx-[2px] transition opacity-0 pointer-events-none;
  }
  .should-sticky .trackdetails {
    @apply border-transparent;
  }
  .volumebtn:focus-within,
  .volumebtn:hover {
    @apply border-fg;
  }
  .volumebtn:focus-within .volumebtn-inner,
  .volumebtn:hover .volumebtn-inner {
    @apply opacity-100 visible pointer-events-auto;
  }

  .loader {
    width: 0.8em;
    height: 0.8em;
    border: 2px solid var(--c-fg);
    border-bottom-color: transparent;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 2s linear infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
