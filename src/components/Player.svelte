<script lang="ts">
  import Slider from "./Slider.svelte";
  import { slide } from "svelte/transition";
  import { blurOnEscape } from "./svelteDirectives";
  import { onMount } from "svelte";

  interface Track {
    artist: string;
    title: string;
    coverArt?: string;
    src: string;
    links?: { [key: string]: string };
  }
  const tracklist: Track[] = [
    {
      artist: "WEST OF EDEN, jun.e, slone",
      title: "Butterfly",
      src: "/butterfly_sclol.mp3",
      links: {
        soundcloud: "https://soundcloud.com/westofeden-music/butterfly",
        spotify:
          "https://open.spotify.com/track/2wqa7edQscmRTT46aoHCNS?si=7bf920dc96bc418c",
      },
    },
    {
      artist: "WEST OF EDEN, jun.e, riensu, keanu",
      title: "Won't Let You Go",
      src: "/wlyg_master.wav",
      links: {
        soundcloud: "https://soundcloud.com/westofeden-music/wont-let-you-go",
        spotify:
          "https://open.spotify.com/track/5xmcU7dotR2SeiYg43cMQX?si=76b63a7013b74b35",
      },
    },
  ];

  let currentIndex = -1;
  type Some<T> = T | null;
  let audioPlayer: HTMLAudioElement;
  let duration;
  let currentTime = 0;
  let paused = true; // <- do i need this

  let slider;

  let isPlaying = false;

  const statusCodes = {
    waiting: "waiting...",
    canplay: "song can play",
    canplaythrough: "can play through all tracks",
    seeking: "seeking...",
    playing: "playing",
  }; // i also dont need whatever this is. i jsut need the enums
  type Status = keyof typeof statusCodes;

  let status: Status = "waiting";
  $: currentTrack = tracklist[currentIndex >= 0 ? currentIndex : 0];
  function loadTrack(index: number) {
    currentIndex = index;

    audioPlayer.load();
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

  function onCanPlay() {
    status = "canplay";
    if (isPlaying) audioPlayer.play();
  }
  const format = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

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
    localStorage.setItem("volume", volume2.toString());
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
  src={currentTrack.src}
/>

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
        <span class="time">{format(currentTime)}</span>

        <div class="flex-grow">
          <Slider
            bind:this={slider}
            min={0}
            bind:value={currentTime}
            max={duration}
            step={0.01}
            precision={2}
            formatter={(v) => format(v)}
          />
        </div>

        <span class="duration">{format(duration)}</span>
      </div>
    {/if}
    <div class="trackdetails">
      <div class="">
        <h2 class="font-serif italic text-3xl">{track.title}</h2>
        <p>{track.artist}</p>
      </div>
      <div class="flex flex-col items-end">
        <div class="flex gap-2">
          {#if currentTrack.src === track.src && currentIndex !== -1}
            <button
              class="volumebtn relative py-0 px-1 font-serif italic text-2xl hover:text-bg hover:bg-fg"
              type="button"
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
    opacity: 0;
    pointer-events: none;
    @apply -mx-[2px] transition;
  }
  .should-sticky .trackdetails {
    @apply border-transparent;
  }
  .volumebtn:focus-within,
  .volumebtn:hover {
    @apply border-fg bg-[var(--c-dark)] text-[var(--c-light)];
  }
  .volumebtn:focus-within .volumebtn-inner,
  .volumebtn:hover .volumebtn-inner {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
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
  /* HTML: <div class="loader"></div> */
  /* .loader2 {
    width: 112px;
    height: 218px;
    border-radius: 8px;
    background: #fff;
    background-image: linear-gradient(#c70000 30px, transparent 0),
      linear-gradient(#e4c200 30px, transparent 0),
      linear-gradient(#00a136 30px, transparent 0),
      linear-gradient(#0026ff 30px, transparent 0),
      linear-gradient(#7e0069 30px, transparent 0);
    background-repeat: no-repeat;
    background-position:
      5px 5px,
      5px 40px,
      5px 75px,
      5px 110px,
      5px 145px;
    background-size: 90px 30px;
    border: 6px solid #222;
    border-width: 18px 6px 20px;
    box-sizing: border-box;
    position: relative;
    animation: clpszp 4s linear infinite;
  }
  .loader2:before {
    content: "";
    position: absolute;
    left: -6px;
    top: -18px;
    width: 112px;
    height: 218px;
    border-radius: 8px;
    background: linear-gradient(
      80deg,
      rgba(0, 0, 0, 0.05) 45%,
      rgba(0, 0, 0, 0) 46%
    );
  }
  .loader2:after {
    content: "";
    position: absolute;
    box-sizing: border-box;
    left: 60px;
    top: 8px;
    width: 24px;
    height: 24px;
    z-index: 2;
    backdrop-filter: blur(5px);
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.12);
    border: 2px solid rgba(255, 255, 255, 0.2);
    animation: thumbMove 4s linear infinite;
  }

  @keyframes thumbMove {
    0% {
      left: 60px;
      top: 8px;
    }
    10% {
      left: 20px;
      top: 8px;
    }
    20% {
      left: 10px;
      top: 40px;
    }
    30% {
      left: 50px;
      top: 40px;
    }
    40% {
      left: 50px;
      top: 80px;
    }
    50% {
      left: 20px;
      top: 80px;
    }
    60% {
      left: 10px;
      top: 110px;
    }
    70% {
      left: 60px;
      top: 110px;
    }
    80% {
      left: 75px;
      top: 135px;
    }
    90% {
      left: 45px;
      top: 155px;
    }
    100% {
      left: 25px;
      top: 8px;
    }
  }

  @keyframes clpszp {
    0% {
      background-position:
        5px 5px,
        5px 40px,
        5px 75px,
        5px 110px,
        5px 145px;
    }
    20% {
      background-position:
        -100px 5px,
        5px 40px,
        5px 75px,
        5px 110px,
        5px 145px;
    }
    40% {
      background-position:
        -100px 5px,
        100px 40px,
        5px 75px,
        5px 110px,
        5px 145px;
    }
    60% {
      background-position:
        -100px 5px,
        100px 40px,
        -100px 75px,
        5px 110px,
        5px 145px;
    }
    80% {
      background-position:
        -100px 5px,
        100px 40px,
        -100px 75px,
        100px 110px,
        5px 145px;
    }
    100% {
      background-position:
        -100px 5px,
        100px 40px,
        -100px 75px,
        100px 110px,
        -100px 145px;
    }
  } */
</style>
