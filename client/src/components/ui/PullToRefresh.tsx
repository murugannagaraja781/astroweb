// Pull to Refresh Component - React Native style
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useState, ReactNode } from 'react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: ReactNode;
    threshold?: number;
}

const PullToRefresh = ({ onRefresh, children, threshold = 80 }: PullToRefreshProps) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const y = useMotionValue(0);
    const rotate = useTransform(y, [0, threshold], [0, 180]);
    const opacity = useTransform(y, [0, threshold], [0, 1]);

    const handleDragEnd = async (_: any, info: PanInfo) => {
        if (info.offset.y > threshold && !isRefreshing) {
            setIsRefreshing(true);
            await onRefresh();
            setIsRefreshing(false);
            y.set(0);
        } else {
            y.set(0);
        }
    };

    return (
        <div className="relative overflow-hidden">
            {/* Refresh Indicator */}
            <motion.div
                style={{ y, opacity }}
                className="absolute top-0 left-0 right-0 flex justify-center items-center h-20 z-10"
            >
                <motion.div
                    style={{ rotate }}
                    className={`p-3 rounded-full bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 ${isRefreshing ? 'animate-spin' : ''
                        }`}
                >
                    <RefreshCw className="w-5 h-5 text-purple-400" />
                </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{ y }}
                className="touch-pan-y"
            >
                {children}
            </motion.div>
        </div>
    );
};

export default PullToRefresh;
