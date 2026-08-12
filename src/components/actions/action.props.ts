import { Prop, type MixedInCtor } from '@stencil/core';

export const withActionProps = <T extends MixedInCtor>(Base: T) => {
  class ActionProps extends Base {
    /** Prevents activation, navigation, and secondary actions such as removal. */
    @Prop({ reflect: true }) disabled: boolean = false;

    /** Destination used when the component operates as a link. */
    @Prop() href?: string;
    /** Defaults to `noopener noreferrer` when `target="_blank"`. */
    @Prop() rel?: string;
    /** Enables native download behavior when the component operates as a link. */
    @Prop() download?: string;
  }

  return ActionProps;
};

export const withActionLabel = <T extends MixedInCtor>(Base: T) => {
  class ActionLabel extends Base {
    /** Text used when slotted content cannot supply the component's required label. */
    @Prop() label?: string;
  }

  return ActionLabel;
};
