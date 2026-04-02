import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--btn-primary)] text-[var(--btn-primary-foreground)] hover:bg-[var(--btn-hover)] hover:text-[var(--btn-hover-foreground)] shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Inject dynamic theme engine styles
    const themeStyles: React.CSSProperties = {
      borderRadius: 'var(--btn-radius)',
      transform: 'scale(var(--btn-scale))',
      fontWeight: 'var(--btn-font-weight)',
      textTransform: (variant !== 'link' ? 'var(--btn-text-transform)' : 'none') as any,
      borderWidth: (variant === 'default' ? 'var(--btn-border-width)' : undefined),
      borderColor: (variant === 'default' ? 'rgba(0,0,0,0.1)' : undefined),
      ...style
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={themeStyles}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
