<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import GraphView from './GraphView.svelte';
  import type { Note } from '../../types';

  const dispatch = createEventDispatcher();

  let floatingWindow: HTMLElement;
  let top: number | null = null;
  let left: number | null = null;
  let isDragging = false;
  let offsetX: number;
  let offsetY: number;

  // The "algorithm" for initial position is to place it in the top right corner.
  // We use CSS for this initial positioning to avoid race conditions with element dimensions.
  // The component will be positioned with `right: 20px; top: 20px;`.
  // When dragging starts, we switch to JS-based positioning (`top` and `left`).

  function onMouseDown(e: MouseEvent) {
    isDragging = true;
    const rect = floatingWindow.getBoundingClientRect();
    
    // If we haven't dragged before, calculate initial top/left from CSS position
    if (top === null) {
      top = rect.top;
      left = rect.left;
    }

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e: MouseEvent) {
    if (isDragging) {
      top = e.clientY - offsetY;
      left = e.clientX - offsetX;
    }
  }

  function onMouseUp() {
    isDragging = false;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  onMount(() => {
    return () => {
      // Cleanup listeners when component is destroyed
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  });

  function handleSelectNote(event: CustomEvent<Note>) {
    dispatch('selectNote', event.detail);
    dispatch('close');
  }
</script>

<div
  bind:this={floatingWindow}
  class="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-2xl flex flex-col"
  style:top={top === null ? '20px' : `${top}px`}
  style:left={left === null ? null : `${left}px`}
  style:right={left === null ? '20px' : null}
  style:width="600px"
  style:height="500px"
  style:z-index="50"
>
  <div
    class="bg-gray-700 p-2 flex justify-between items-center cursor-move rounded-t-lg"
    on:mousedown={onMouseDown}
  >
    <h2 class="text-lg font-semibold">Global Graph</h2>
    <button on:click={() => dispatch('close')} class="text-xl leading-none px-2 py-1 hover:bg-gray-600 rounded">&times;</button>
  </div>
  <div class="flex-grow p-2 h-full">
    <GraphView on:selectNote={handleSelectNote} />
  </div>
</div>