import type { SharedProps } from '#imports'

export interface ButtonProps extends Pick<SharedProps, 'size'> {
  appearance: string
}
