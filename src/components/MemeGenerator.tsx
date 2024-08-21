import { createSignal, createEffect, onMount, For } from 'solid-js';
import type { Component } from 'solid-js';
import { MemeModel } from '../models/MemeModel';
import styles from './MemeGenerator.module.css';

const MemeGenerator: Component = () => {
    const [memeModel, setMemeModel] = createSignal<MemeModel | null>(null);
    const [isDrawing, setIsDrawing] = createSignal(false);
    const [startPos, setStartPos] = createSignal({ x: 0, y: 0 });

    onMount(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (canvas) {
            setMemeModel(new MemeModel(canvas));
        }
    });

    createEffect(() => {
        if (memeModel()) {
            memeModel()!.redrawCanvas();
        }
    });

    const handleMouseDown = (e: MouseEvent) => {
        if (!memeModel()) return;
        const canvas = memeModel()!.getCanvas();
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setStartPos({ x, y });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDrawing() || !memeModel()) return;
        const canvas = memeModel()!.getCanvas();
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        memeModel()!.redrawCanvas();
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(startPos().x, startPos().y, x - startPos().x, y - startPos().y);
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        if (!isDrawing() || !memeModel()) return;
        setIsDrawing(false);
        const canvas = memeModel()!.getCanvas();
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newBox = {
            x: Math.min(startPos().x, x),
            y: Math.min(startPos().y, y),
            width: Math.abs(x - startPos().x),
            height: Math.abs(y - startPos().y),
        };
        memeModel()!.addBox(newBox);
    };

    const handleTextChange = (index: number, value: string) => {
        memeModel()?.updateText(index, value);
    };

    return (
        <div class={styles.container}>
            <h1 class={styles.title}>Meme Generator</h1>
            <div class={styles.content}>
                <div class={styles.canvasContainer}>
                    <canvas
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        class={styles.canvas}
                    />
                </div>
                <div class={styles.inputsContainer}>
                    <h2 class={styles.subtitle}>Text Inputs</h2>
                    <For each={memeModel()?.getBoxes()}>
                        {(_, index) => (
                            <input
                                type="text"
                                class={styles.textInput}
                                placeholder={`Text for box ${index() + 1}`}
                                value={memeModel()?.getTexts()[index()] || ''}
                                onInput={(e: InputEvent) => handleTextChange(index(), (e.target as HTMLInputElement).value)}
                            />
                        )}
                    </For>
                    <button
                        onClick={() => {
                            const canvas = memeModel()?.getCanvas();
                            if (canvas) {
                                const link = document.createElement('a');
                                link.download = 'meme.png';
                                link.href = canvas.toDataURL();
                                link.click();
                            }
                        }}
                        class={styles.downloadButton}
                    >
                        Download Meme
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MemeGenerator;