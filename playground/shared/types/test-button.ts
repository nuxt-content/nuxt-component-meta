import type { SharedProps } from '#imports'

export interface TestButtonProps extends Pick<SharedProps, 'size'> {
  appearance: string
}
