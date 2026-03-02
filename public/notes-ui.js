// Section: Notes page helpers (drag-and-drop ordering)
(() => {
  // Section: Auto-hide success messages after a short time.
  function setupAutoDismissMessages() {
    const flashMessages = document.querySelectorAll('[data-auto-dismiss]');

    flashMessages.forEach((message) => {
      const timeoutValue = Number(message.getAttribute('data-auto-dismiss'));
      const timeoutMs = Number.isFinite(timeoutValue) ? timeoutValue : 3000; // Default to 3 seconds when value is missing.

      window.setTimeout(() => {
        message.classList.add('is-hiding');

        window.setTimeout(() => {
          message.remove();
        }, 220);
      }, timeoutMs);
    });
  }

  setupAutoDismissMessages();

  // Section: Drag-and-drop only runs on the notes page.
  const notesGrid = document.getElementById('notesGrid');

  if (!notesGrid) {
    return;
  }

  let draggedCard = null;
  let dropTargetCard = null;
  let shouldDropBefore = false;
  let maximizedCard = null;

  // Section: Collect all note cards currently shown in the grid.
  function getCards() {
    return Array.from(notesGrid.querySelectorAll('.note-card[data-note-id]'));
  }

  function getCardId(card) {
    return card?.getAttribute('data-note-id') || '';
  }

  function getCardPinnedState(card) {
    return card?.getAttribute('data-is-pinned') === 'true';
  }

  function getCardFromNode(node) {
    if (!node) {
      return null;
    }

    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node; // If this is text, use its parent element to find the note card.
    return element?.closest?.('.note-card[data-note-id]') || null;
  }

  // Section: Maximize/minimize helpers for each note card.
  function setSizeToggleButtonState(card, isMaximized) {
    const toggleButton = card?.querySelector('[data-note-toggle-size]');

    if (!toggleButton) {
      return;
    }

    toggleButton.textContent = isMaximized ? '🗗' : '🗖';
    toggleButton.setAttribute('aria-expanded', isMaximized ? 'true' : 'false');
    toggleButton.setAttribute('aria-label', isMaximized ? 'Return note to normal size' : 'Expand note');
    toggleButton.setAttribute('title', isMaximized ? 'Restore down' : 'Expand');
  }

  function minimizeCard(card) {
    if (!card) {
      return;
    }

    card.classList.remove('note-card--maximized');
    card.setAttribute('draggable', getCardPinnedState(card) ? 'true' : 'false'); // Restore drag only for pinned cards.
    setSizeToggleButtonState(card, false);

    if (maximizedCard === card) {
      maximizedCard = null;
      document.body.classList.remove('note-overlay-open');
    }
  }

  function maximizeCard(card) {
    if (!card) {
      return;
    }

    if (maximizedCard && maximizedCard !== card) {
      minimizeCard(maximizedCard);
    }

    card.classList.add('note-card--maximized');
    card.setAttribute('draggable', 'false');
    setSizeToggleButtonState(card, true);
    maximizedCard = card;
    document.body.classList.add('note-overlay-open');
  }

  function toggleCardSize(card) {
    if (!card) {
      return;
    }

    if (card.classList.contains('note-card--maximized')) {
      minimizeCard(card);
      return;
    }

    maximizeCard(card);
  }

  function getPinnedOrder() {
    return getCards()
      .filter((card) => getCardPinnedState(card)) // Reorder list is pinned-only.
      .map(getCardId)
      .filter(Boolean);
  }

  async function saveOrder(noteIds) {
    try {
      await fetch('/notes/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ noteIds }), // Server assumes pinned reorder endpoint contract.
      });
    } catch (error) {
      console.error('Failed to save note order:', error);
    }
  }

  // Section: Save the card being dragged.
  function onDragStart(event) {
    draggedCard = event.currentTarget;

    if (draggedCard?.classList.contains('note-card--maximized')) {
      event.preventDefault(); // Prevent dragging while a card is in expanded mode.
      draggedCard = null;
      dropTargetCard = null;
      shouldDropBefore = false;
      return;
    }

    if (maximizedCard && maximizedCard !== draggedCard) {
      minimizeCard(maximizedCard);
    }

    dropTargetCard = null;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', getCardId(draggedCard)); // Keep drag theme valid across browsers.
  }

  // Section: Decide whether the dragged card should drop before or after the target card.
  function onDragOver(event) {
    event.preventDefault();

    if (!draggedCard) {
      return;
    }

    const targetCard = event.target.closest('.note-card[data-note-id]');

    if (!targetCard || targetCard === draggedCard) {
      return;
    }

    if (!getCardPinnedState(targetCard)) {
      return; // Ignore unpinned cards as drop targets.
    }

    const targetRect = targetCard.getBoundingClientRect();
    const targetCenterY = targetRect.top + targetRect.height / 2;

    shouldDropBefore = event.clientY < targetCenterY;
    dropTargetCard = targetCard;
  }

  // Section: Move the dragged card in the DOM based on the last calculated drop position.
  function onDrop(event) {
    event.preventDefault();

    if (!draggedCard || !dropTargetCard || draggedCard === dropTargetCard) {
      return;
    }

    if (!getCardPinnedState(dropTargetCard)) {
      return; // Safety check before DOM move.
    }

    if (shouldDropBefore) {
      notesGrid.insertBefore(draggedCard, dropTargetCard);
      return;
    }

    notesGrid.insertBefore(draggedCard, dropTargetCard.nextSibling);
  }

  // Section: After drag ends, save the new order to the server.
  async function onDragEnd() {
    if (!draggedCard) {
      return;
    }

    draggedCard = null;
    dropTargetCard = null;
    shouldDropBefore = false;
    await saveOrder(getPinnedOrder()); // Save pinned order after drag completes.
  }

  // Section: Each card needs drag start and drag end handlers.
  function bindDragEvents(card) {
    if (!getCardPinnedState(card)) {
      return;
    }

    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragend', onDragEnd);
  }

  // Section: Wire grid-level drag/drop behavior.
  function setupDragAndDrop() {
    getCards().forEach(bindDragEvents);
    notesGrid.addEventListener('dragover', onDragOver);
    notesGrid.addEventListener('drop', onDrop);
  }

  // Section: Handle note card maximize/minimize actions.
  function setupCardSizeToggle() {
    notesGrid.addEventListener('click', (event) => {
      const toggleButton = event.target.closest('[data-note-toggle-size]');

      if (!toggleButton) {
        return;
      }

      event.preventDefault();
      const card = toggleButton.closest('.note-card[data-note-id]');
      toggleCardSize(card);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !maximizedCard) {
        return;
      }

      minimizeCard(maximizedCard);
    });
  }

  // Section: Confirm note deletion with Bootstrap modal.
  function setupDeleteConfirmation() {
    const modalElement = document.getElementById('deleteNoteConfirmModal');
    const confirmButton = document.getElementById('confirmDeleteNoteButton');
    const noteName = document.getElementById('deleteNoteConfirmName');

    if (!modalElement || !confirmButton || !noteName || typeof bootstrap === 'undefined') {
      return;
    }

    const deleteModal = new bootstrap.Modal(modalElement);
    let selectedDeleteForm = null;

    notesGrid.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-delete-confirm-trigger]');

      if (!trigger) {
        return;
      }

      event.preventDefault();
      selectedDeleteForm = trigger.closest('form[data-delete-note-form]'); // Store which form should submit after confirm.

      if (!selectedDeleteForm) {
        return;
      }

      const rawTitle = trigger.getAttribute('data-note-title') || '';
      noteName.textContent = rawTitle ? `"${rawTitle}"` : ''; // Show which note is being deleted.
      deleteModal.show();
    });

    confirmButton.addEventListener('click', () => {
      if (!selectedDeleteForm) {
        return;
      }

      selectedDeleteForm.submit();
    });

    modalElement.addEventListener('hidden.bs.modal', () => {
      selectedDeleteForm = null; // Clear selection so old forms are not reused.
      noteName.textContent = ''; // Clear note name after modal closes.
    });
  }

  // Section: Keep text selection inside one note card at a time.
  function setupSingleNoteSelection() {
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed) {
        return;
      }

      const anchorCard = getCardFromNode(selection.anchorNode);
      const focusCard = getCardFromNode(selection.focusNode);

      if (!anchorCard || !focusCard) {
        return;
      }

      if (anchorCard !== focusCard) {
        selection.removeAllRanges(); // Block selecting text across multiple notes.
      }
    });
  }

  // Section: Auto-retract search scope dropdown when left open.
  // How this works:
  // 1) When the dropdown gets focus, start a 4-second timer.
  // 2) If the user picks an option (or closes the dropdown), clear the timer.
  // 3) If no selection is made in 4 seconds, blur the dropdown to close it.
  function setupSearchScopeAutoRetract() {
    const searchScope = document.getElementById('searchScope');

    if (!searchScope) {
      return;
    }

    let timerId;

    searchScope.addEventListener('focus', () => {
      window.clearTimeout(timerId); // Reset timer if user focuses again.

      timerId = window.setTimeout(() => {
        searchScope.blur(); // Close/retract dropdown after 4 seconds.
      }, 4000);
    });

    searchScope.addEventListener('change', () => {
      window.clearTimeout(timerId); // Stop timer when user picks an option.
    });

    searchScope.addEventListener('blur', () => {
      window.clearTimeout(timerId); // Stop timer when dropdown closes.
    });
  }

  setupDragAndDrop();
  setupCardSizeToggle();
  setupDeleteConfirmation();
  setupSingleNoteSelection();
  setupSearchScopeAutoRetract();
})();
