<script>
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let value = 50;
  let percentageValue;

  export let prefix = "";
  export let suffix = "";
  export let formatter = (v) => v;
  export let handleFormatter = formatter;

  export let precision = 3;
  export let square = false;
  export let vertical = false;
  let float = true;
  let hover = true;

  let slider;
  let handle;
  let bar;
  let fill;

  let focus = false;
  let handleActivated = false;
  let handlePressed = false;
  let keyboardActive = false;
  let activeHandle = value;

  $: value = clampValue(value);
  $: percentageValue = percentOf(alignValueToStep(value));

  $: percentOf = function (value) {
    let percent = ((value - min) / (max - min)) * 100;
    if (percent >= 100) {
      return 100;
    } else if (percent <= 0) {
      return 0;
    } else {
      return parseFloat(percent.toFixed(precision));
    }
  };

  $: clampValue = function (value) {
    return value <= min ? min : value >= max ? max : value;
  };

  $: alignValueToStep = function (value) {
    if (value <= min) {
      return min;
    } else if (value >= max) {
      return max;
    }
    let remainder = (value - min) % step;
    let aligned = value - remainder;
    if (Math.abs(remainder) * 2 >= step) {
      aligned += remainder > 0 ? step : -step;
    }
    aligned = clampValue(aligned);
    return parseFloat(aligned.toFixed(precision));
  };

  function index(element) {
    if (!element) return -1;
    var i = 0;
    while ((element = element.previousElementSibling)) {
      i++;
    }
    return i;
  }

  function normalisedClient(event) {
    if (event.type.includes("touch")) {
      return event.touches[0];
    } else {
      return event;
    }
  }

  function eventPosition(event) {
    return vertical
      ? normalisedClient(event).clientY
      : normalisedClient(event).clientX;
  }

  function targetIsHandle(element) {
    const handles = slider.querySelectorAll(".handle");
    const isHandle = Array.prototype.includes.call(handles, element);
    const isChild = Array.prototype.some.call(handles, (event) =>
      event.contains(element)
    );
    return isHandle || isChild;
  }

  function trimRange(value) {
    return value;
  }

  function getSliderDimensions() {
    return slider.getBoundingClientRect();
  }

  function handleInteract(clientPosition) {
    const dimensions = getSliderDimensions();
    let interactionPosition = 0;
    let interactionPercent = 0;
    let interactionValue = 0;
    if (vertical) {
      interactionPosition = clientPosition - dimensions.top;
      interactionPercent = (interactionPosition / dimensions.height) * 100;
      interactionValue = 100 - ((max - min) / 100) * interactionPercent + min;
    } else {
      interactionPosition = clientPosition - dimensions.left;
      interactionPercent = (interactionPosition / dimensions.width) * 100;
      interactionValue = ((max - min) / 100) * interactionPercent + min;
    }
    // thank you @jensa!
    value = clampValue(interactionValue);
  }

  function fillStart(value) {
    return value;
  }

  function fillEnd(value) {
    return 100 - value;
  }

  function sliderBlurHandle(e) {
    if (keyboardActive) {
      focus = false;
      handleActivated = false;
      handlePressed = false;
    }
  }

  function sliderFocusHandle(event) {
    activeHandle = value;
    focus = true;
  }

  function sliderKeydown(e) {
    const handle = index(e.target);
    let jump = e.ctrlKey || e.metaKey || e.shiftKey ? step * 10 : step;
    let prevent = false;
    switch (e.key) {
      case "PageDown":
        jump *= 10;
      case "ArrowRight":
      case "ArrowUp":
        moveHandle(handle, value + jump);
        prevent = true;
        break;
      case "PageUp":
        jump *= 10;
      case "ArrowLeft":
      case "ArrowDown":
        moveHandle(handle, value - jump);
        prevent = true;
        break;
      case "Home":
        moveHandle(handle, min);
        prevent = true;
        break;
      case "End":
        moveHandle(handle, max);
        prevent = true;
        break;
    }
    if (prevent) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function sliderInteractStart(event) {
    const position = eventPosition(event);
    focus = true;
    handleActivated = true;
    handlePressed = true;
    activeHandle;
    if (event.type === "touchstart") {
      handleInteract(position);
    }
  }

  function sliderInteractEnd(event) {
    handlePressed = false;
  }

  function bodyInteractStart(event) {
    keyboardActive = false;
    if (focus && event.target !== slider && !slider.contains(event.target)) {
      focus = false;
    }
  }

  function bodyInteract(event) {
    if (handleActivated) {
      handleInteract(eventPosition(event));
    }
  }

  function bodyMouseUp(event) {
    const element = event.target;
    if (handleActivated && (element === slider || slider.contains(element))) {
      focus = true;
      if (!targetIsHandle(element)) {
        handleInteract(eventPosition(event));
      }
    }
    handleActivated = false;
    handlePressed = false;
  }

  function bodyTouchEnd(event) {
    handleActivated = false;
    handlePressed = false;
  }

  function bodyKeyDown(event) {
    if (event.target === slider || slider.contains(event.target)) {
      keyboardActive = true;
    }
  }
</script>

<svelte:window
  on:mousedown={bodyInteractStart}
  on:touchstart={bodyInteractStart}
  on:mousemove={bodyInteract}
  on:touchmove={bodyInteract}
  on:mouseup={bodyMouseUp}
  on:touchend={bodyTouchEnd}
  on:keydown={bodyKeyDown}
/>

<!-- {id} - for the slider...not sure when I would need this -->
<div
  class="slider"
  bind:this={slider}
  class:square={square === true}
  class:vertical
  class:focus
  on:touchstart|preventDefault={sliderInteractStart}
  on:mousedown={sliderInteractStart}
  on:touchend|preventDefault={sliderInteractEnd}
  on:mouseup={sliderInteractEnd}
>
  <span
    bind:this={handle}
    class="handle"
    role="slider"
    tabindex="0"
    class:hoverable={hover}
    class:active={focus}
    class:press={handlePressed}
    on:blur={sliderBlurHandle}
    on:focus={sliderFocusHandle}
    on:keydown={sliderKeydown}
    style="{vertical ? 'top' : 'left'}:  
    {vertical ? 100 - percentageValue : percentageValue}%;"
    aria-valuenow={percentageValue}
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuetext="{prefix}{handleFormatter(percentageValue)}{suffix}"
    aria-orientation={vertical ? "vertical" : "horizontal"}
  >
    <span class="nub" />
    <span class="float">{prefix}{handleFormatter(value)}{suffix}</span>
  </span>
  <span
    bind:this={fill}
    class="fill"
    class:square={square === true}
    style="{vertical ? 'bottom' : 'left'}: {fillStart(min)}%;
      {vertical ? 'top' : 'right'}: {fillEnd(percentageValue)}%;"
  />
</div>

<style lang="postcss">
  .slider {
    --size: 0.5rem;
    --handle-border: hsla(0, 0%, 2%, 0.5);
  }

  .slider {
    position: relative;
    margin: 0;
    padding: 0;
    height: var(--size);
  }

  .slider,
  .slider * {
    user-select: none;
  }

  .slider.vertical {
    display: inline-block;
    width: var(--size);
    min-height: 35px;
    height: 100%;
  }

  .slider .handle {
    position: absolute;
    display: block;
    height: calc(var(--size) * 2);
    width: calc(var(--size) * 2);
    top: calc(var(--size) / 2);
    left: calc(var(--size) / 2);
    transform: translateY(-50%) translateX(-50%);
    z-index: 3;
    outline: none;
  }

  .slider .nub,
  .slider .handle:before {
    position: absolute;
    left: 0;
    top: 0;
    display: block;
    height: 100%;
    width: 100%;
    transition: all 0.25s ease;
  }

  .slider .handle:before {
    content: "";
    left: 1px;
    top: 1px;
    bottom: 1px;
    right: 1px;
    height: auto;
    width: auto;
    box-shadow: 0 0 0 0 var(--handle-border);
    opacity: 0;
  }

  .slider .handle.hoverable:hover:before {
    box-shadow: 0 0 0 6px hsla(0, 0%, 0%, 1);
    opacity: 0.2;
  }

  .slider .handle.hoverable.press:before,
  .slider .handle.hoverable.press:hover:before {
    box-shadow: 0 0 0 8px var(--handle-border);
    opacity: 0.4;
  }

  .slider .float {
    display: none;
    position: absolute;
    left: 50%;
    top: -1.2rem;
    transform: translate(-50%, -100%);
    font-size: 1.2rem;
    text-align: center;
    opacity: 0;
    pointer-events: none;
    white-space: nowrap;
    transition: all 0.25s ease;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .slider .handle.active .float,
  .slider .handle.hoverable:hover .float {
    opacity: 1;
    top: -0.5rem;
    transform: translate(-50%, -100%);
  }

  .slider .fill {
    position: absolute;
    display: block;
    transition: background 0.2s ease;
    /* border-radius: var(--size); */
    inset: 0;

    user-select: none;
    z-index: 1;
  }

  .slider.vertical .fill {
    height: auto;
  }

  .slider {
    border: 1px solid var(--c-fg);
  }

  .slider .fill {
    background-color: var(--c-fg);
  }

  .slider .nub {
    background-color: var(--c-bg);
    border: 2px solid var(--c-fg);
  }

  .slider.focus .fill {
    background-color: blue;
  }

  .slider.focus .nub {
    background-color: hsla(182, 100%, 90%, 1);
  }

  .slider .handle.active .nub {
    background-color: blue;
    border-color: var(--c-bg);
  }

  .slider .float {
    color: hsla(0, 0%, 100%, 1);
    background-color: var(--c-fg);
  }

  .slider.focus .float {
    background-color: blue;
  }

  .square {
    border-radius: 0;
  }
</style>
