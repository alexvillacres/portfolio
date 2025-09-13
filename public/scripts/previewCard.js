// Store references to cleanup previous instances
let initializedTriggers = new Set();

export const setupPreviewCards = () => {
    // Clean up any existing preview cards first
    const existingPopups = document.querySelectorAll('[data-preview-popup]');
    existingPopups.forEach(popup => popup.remove());
    initializedTriggers.clear();

    const triggers = document.querySelectorAll('[data-preview-trigger]');

    triggers.forEach((trigger) => {
        const id = trigger.getAttribute('data-preview-trigger');
        const description = trigger.getAttribute('data-preview-description');
        const imageSrc = trigger.getAttribute('data-preview-image');
        
        // Create popup dynamically
        const popup = document.createElement('div');
        popup.setAttribute('data-preview-popup', id);
        popup.setAttribute('role', 'tooltip');
        popup.setAttribute('aria-hidden', 'true');
        popup.className = 'hidden fixed top-0 z-50 bg-white rounded-xl p-2 border border-gray-100 transition-all duration-150 ease-out opacity-0 scale-[0.98] origin-center-bottom';
        
        let popupContent = '';
        if (imageSrc && imageSrc !== 'undefined') {
            popupContent += `<div class="relative inline-block"><img class="mb-1 rounded-lg w-full" src="${imageSrc}" alt="${id}" /></div>`;
        }
        popupContent += `<p class="text-sm">${description}</p>`;
        
        popup.innerHTML = popupContent;

        const canHover = matchMedia('(hover:hover) and (pointer:fine)').matches;
        if (!canHover) return;

        // Skip if already initialized
        if (initializedTriggers.has(trigger)) return;
        initializedTriggers.add(trigger);

        document.body.appendChild(popup);
        popup.style.top = "0px";
        popup.style.left = "0px";
        
        // State management
        let showTimeout = null;
        let hideTimeout = null;
        let isVisible = false;

        const placePopup = () => {
            const rect = trigger.getBoundingClientRect();

            // Find the layout containers to calculate gutter space
            const rootLayoutContent = document.querySelector('.RootLayoutContent');
            const blogLayoutRoot = document.querySelector('.BlogLayoutRoot');
            
            if (!rootLayoutContent || !blogLayoutRoot) return;
            
            const rootRect = rootLayoutContent.getBoundingClientRect();
            const blogRect = blogLayoutRoot.getBoundingClientRect();
            
            // Calculate available gutter space on each side
            const leftGutterStart = rootRect.left;
            const leftGutterEnd = blogRect.left;
            const rightGutterStart = blogRect.right;
            const rightGutterEnd = rootRect.right;
            
            const leftGutterWidth = leftGutterEnd - leftGutterStart;
            const rightGutterWidth = rightGutterEnd - rightGutterStart;
            
            const gutterPadding = 32; // Padding from edges
            const minPopupWidth = 200; // Minimum width to ensure readability
            
            // Decide which gutter to use based on available space and trigger position
            const triggerCenterX = rect.left + rect.width / 2;
            const useLeftGutter = (leftGutterWidth >= minPopupWidth + (gutterPadding * 2)) && 
                                 (triggerCenterX < window.innerWidth / 2 || rightGutterWidth < minPopupWidth + (gutterPadding * 2));
            
            let left, popupWidth;
            if (useLeftGutter && leftGutterWidth >= minPopupWidth + (gutterPadding * 2)) {
                // Use left gutter
                popupWidth = leftGutterWidth - (gutterPadding * 2);
                left = leftGutterStart + gutterPadding;
            } else if (rightGutterWidth >= minPopupWidth + (gutterPadding * 2)) {
                // Use right gutter
                popupWidth = rightGutterWidth - (gutterPadding * 2);
                left = rightGutterStart + gutterPadding;
            } else {
                // Fallback: use fixed width and position at right edge
                popupWidth = 288; // max-w-72 fallback
                left = window.innerWidth - popupWidth - gutterPadding;
            }
            
            // Set the dynamic width
            popup.style.width = `${popupWidth}px`;

            // Use fixed positioning
            popup.style.position = "fixed";
            popup.style.top = `${rect.top}px`;
            popup.style.left = `${left}px`;
        }

        function show() {
            // Clear any pending hide timeout
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
            
            // If already visible, don't show again
            if (isVisible) return;
            
            placePopup();
            popup.classList.remove("hidden");
            popup.setAttribute("aria-hidden", "false");
            
            // Clear any existing show timeout
            if (showTimeout) clearTimeout(showTimeout);
            
            showTimeout = setTimeout(() => {
                popup.classList.remove("opacity-0", "scale-[0.98]");
                popup.classList.add("opacity-100", "scale-100");
                isVisible = true;
                showTimeout = null;
            }, 300);
        }

        function hide() {
            // Clear any pending show timeout
            if (showTimeout) {
                clearTimeout(showTimeout);
                showTimeout = null;
            }
            
            // If not visible, don't hide
            if (!isVisible) return;
            
            // Clear any existing hide timeout
            if (hideTimeout) clearTimeout(hideTimeout);
            
            hideTimeout = setTimeout(() => {
                popup.classList.remove("opacity-100", "scale-100");
                popup.classList.add("opacity-0", "scale-[0.98]");
                popup.setAttribute("aria-hidden", "true");
                
                setTimeout(() => {
                    popup.classList.add("hidden");
                    isVisible = false;
                    hideTimeout = null;
                }, 150);
            }, 300);
        }

        trigger.addEventListener("mouseenter", show);
        trigger.addEventListener("mouseleave", hide);
        popup.addEventListener("mouseenter", show);
        popup.addEventListener("mouseleave", hide);
        window.addEventListener("scroll", hide);
        window.addEventListener("resize", () => {
            hide();
        });
    })
}