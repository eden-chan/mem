import { createSignal, createEffect, onMount, For, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { MemeModel } from '../models/MemeModel';
import { listImagesFromS3, deleteFromS3, uploadToS3 } from '../utils/s3';
import { FileUploader } from './FileUploader';
import styles from './MemeGenerator.module.css';

const MemeGenerator: Component = () => {
    const [memeModel, setMemeModel] = createSignal<MemeModel | null>(null);
    const [isDrawing, setIsDrawing] = createSignal(false);
    const [startPos, setStartPos] = createSignal({ x: 0, y: 0 });
    const [canvasSize, setCanvasSize] = createSignal({ width: 0, height: 0 });
    const [images, setImages] = createSignal<string[]>([]);
    const [isDragging, setIsDragging] = createSignal(false);

    onMount(async () => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (canvas) {
            const model = new MemeModel(canvas);
            setMemeModel(model);
            setCanvasSize({ width: canvas.width, height: canvas.height });
        }
        // Load images from S3
        const imageList = await listImagesFromS3();
        setImages(imageList);
    });

    const handleUploadSuccess = (url: string) => {
        setImages([...images(), url]);
        loadImage(url);
    };

    const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (event: DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
        if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
            const file = event.dataTransfer.files[0];
            const url = await uploadToS3(file);
            if (url) {
                setImages([...images(), url]);
                loadImage(url);
            }
        }
    };

    const loadImage = (src: string) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setCanvasSize({ width: img.width, height: img.height });
            if (memeModel()) {
                memeModel()!.setImage(src);
            }
        };
        img.src = src;
    };

    const deleteImage = async (url: string) => {
        await deleteFromS3(url);
        setImages(images().filter(img => img !== url));
    };

    const handleMouseDown = (e: MouseEvent) => {
        if (!memeModel()) return;
        const canvas = memeModel()!.getCanvas();
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        setIsDrawing(true);
        setStartPos({ x, y });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDrawing() || !memeModel()) return;
        const canvas = memeModel()!.getCanvas();
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
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
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
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
                <div
                    class={`${styles.canvasContainer} ${isDragging() ? styles.dragging : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <canvas
                        width={canvasSize().width}
                        height={canvasSize().height}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        class={styles.canvas}
                    />
                    <Show when={isDragging()}>
                        <div class={styles.dropOverlay}>Drop image here</div>
                    </Show>
                </div>
                <div class={styles.inputsContainer}>
                    <h2 class={styles.subtitle}>Upload Image</h2>
                    <FileUploader onUploadSuccess={handleUploadSuccess} />
                    <h2 class={styles.subtitle}>Saved Images</h2>
                    <div class={styles.imageList}>
                        <For each={images()}>
                            {(img) => (
                                <div class={styles.imageItem}>
                                    <img src={img} alt="Saved meme" onClick={() => loadImage(img)} />
                                    <button onClick={() => deleteImage(img)}>Delete</button>
                                </div>
                            )}
                        </For>
                    </div>
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