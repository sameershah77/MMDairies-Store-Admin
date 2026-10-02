import { motion } from 'framer-motion';
import milkImg from '@/assets/login/illust_milk.png';
import curdImg from '@/assets/login/illust_curd.png';
import gheeImg from '@/assets/login/illust_ghee.png';
import lassiImg from '@/assets/login/illust_lassi.png';
import yogurtImg from '@/assets/login/illust_yogurt.png';

const float = (duration: number, delay = 0) => ({
  animate: { y: [0, -10, 0] },
  transition: { duration, repeat: Infinity, ease: 'easeInOut' as const, delay },
});

export function LoginProductShowcase() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px]">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/25 to-white/5 shadow-2xl backdrop-blur-sm" />
      <motion.img
        {...float(4)}
        src={milkImg}
        alt=""
        className="absolute top-[8%] left-[18%] w-[58%] drop-shadow-xl"
      />
      <motion.img
        {...float(3.4, 0.3)}
        src={curdImg}
        alt=""
        className="absolute right-[6%] bottom-[28%] w-[34%] drop-shadow-lg"
      />
      <motion.img
        {...float(3.8, 0.5)}
        src={gheeImg}
        alt=""
        className="absolute bottom-[10%] left-[8%] w-[32%] drop-shadow-lg"
      />
      <motion.img
        {...float(3.2, 0.2)}
        src={lassiImg}
        alt=""
        className="absolute top-[12%] right-[4%] w-[28%] drop-shadow-lg"
      />
      <motion.img
        {...float(3.6, 0.4)}
        src={yogurtImg}
        alt=""
        className="absolute bottom-[8%] right-[22%] w-[30%] drop-shadow-lg"
      />
    </div>
  );
}
