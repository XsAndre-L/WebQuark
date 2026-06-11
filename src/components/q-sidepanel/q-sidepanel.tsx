import { Component, Prop, Element, Event, EventEmitter, Watch, Listen, State, h } from '@stencil/core';
import { handleTabTrap, getFocusableElements, waitForTransitionEnd } from '../../utils/dom';

@Component({
  tag: 'q-sidepanel',
  styleUrl: 'q-sidepanel.css',
  shadow: true,
})
export class QSidepanel {
  @Element() el!: HTMLElement;

  @Prop({ reflect: true }) open: boolean = false;
  @Prop({ reflect: true }) side: 'left' | 'right' | 'top' | 'bottom' = 'right';
  @Prop() panelSize: string = "320px";

  @Event() qClose!: EventEmitter<void>;

  @State() isVisible: boolean = false;
  @State() isAnimatedOpen: boolean = false;

  private drawerEl?: HTMLDivElement;
  private previousActiveElement: HTMLElement | null = null;

  componentWillLoad() {
    this.isVisible = this.open;
    this.isAnimatedOpen = this.open;
  }

  componentDidLoad() {
    if (this.open && this.drawerEl) {
      const focusables = getFocusableElements(this.drawerEl);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        this.drawerEl.focus();
      }
    }
  }

  @Watch('open')
  handleOpenChange(isOpen: boolean) {
    if (isOpen) {
      this.previousActiveElement = document.activeElement as HTMLElement;
      this.isVisible = true;
      // Wait a short delay before initiating transition to guarantee visibility is visible
      setTimeout(() => {
        this.isAnimatedOpen = true;
        if (this.drawerEl) {
          waitForTransitionEnd(this.drawerEl, () => {
            const focusables = getFocusableElements(this.drawerEl);
            if (focusables.length > 0) {
              focusables[0].focus();
            } else {
              this.drawerEl?.focus();
            }
          });
        }
      }, 50);
    } else {
      this.isAnimatedOpen = false;
      if (this.drawerEl) {
        waitForTransitionEnd(this.drawerEl, () => {
          this.isVisible = false;
          if (this.previousActiveElement) {
            this.previousActiveElement.focus();
          }
        });
      } else {
        this.isVisible = false;
      }
    }
  }

  @Listen('keydown', { target: 'window' })
  handleGlobalKeyDown(event: KeyboardEvent) {
    if (this.open && event.key === 'Escape') {
      this.handleClose();
    }
  }

  private handleClose = () => {
    this.qClose.emit();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab' && this.open && this.drawerEl) {
      handleTabTrap(e, this.drawerEl);
    }
  };

  render() {
    const classes = {
      'sidepanel-wrapper': true,
      'is-open': this.isAnimatedOpen,
      'is-visible': this.isVisible,
      [`side-${this.side}`]: true
    };

    const customSizeStyle = {
      '--q-panel-width': this.panelSize
    };

    return (
      <div 
        class={classes} 
        onKeyDown={this.handleKeyDown}
        inert={!this.open ? true : undefined}
      >
        {/* Semi-transparent Backdrop Overlay */}
        <div 
          class="sidepanel-backdrop" 
          onClick={this.handleClose}
          part="backdrop"
        />

        {/* Sliding Panel Drawer */}
        <div 
          ref={(el) => (this.drawerEl = el)}
          class="sidepanel-drawer" 
          style={customSizeStyle}
          part="drawer"
          role="dialog"
          aria-modal="true"
          aria-hidden={this.open ? 'false' : 'true'}
          tabindex="-1"
        >
          {/* Header Slot (Optional title and close btn) */}
          <div class="drawer-header" part="header">
            <slot name="header" />
          </div>

          {/* Core Content Slot */}
          <div class="drawer-body" part="body">
            <slot />
          </div>
        </div>
      </div>
    );
  }
}
