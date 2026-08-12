import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/shared/lib/cn';

/** Magic UI blur-fade entrance for page sections. */
export function BlurFade({
  children,
  className,
  delay = 0,
  yOffset = 10,
  ...props
}: HTMLMotionProps<'div'> & {
  delay?: number;
  yOffset?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.45, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
