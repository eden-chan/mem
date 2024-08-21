import { createSignal, createEffect, For } from 'solid-js';
import { uploadToS3, listImagesFromS3, deleteFromS3 } from '../utils/s3';
import styles from './ImageManager.module.css';

export function ImageManager() {
    const [images, setImages] = createSignal<string[]>([]);
    const [selectedFile, setSelectedFile] = createSignal<File | null>(null);

    createEffect(() => {
        loadImages();
    });

    async function loadImages() {
        const imageList = await listImagesFromS3();
        setImages(imageList);
    }

    async function handleFileChange(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            setSelectedFile(target.files[0]);
        }
    }

    async function handleUpload() {
        if (selectedFile()) {
            const url = await uploadToS3(selectedFile()!);
            if (url) {
                setImages([...images(), url]);
                setSelectedFile(null);
            }
        }
    }

    async function handleDelete(url: string) {
        await deleteFromS3(url);
        setImages(images().filter(img => img !== url));
    }

    return (
        <div class={styles.imageManager}>
            <div class={styles.uploadSection}>
                <input type="file" onChange={handleFileChange} accept="image/*" class={styles.fileInput} />
                <button onClick={handleUpload} disabled={!selectedFile()} class={styles.uploadButton}>Upload</button>
            </div>

            <div class={styles.imageGrid}>
                <For each={images()}>
                    {(imageUrl) => (
                        <div class={styles.imageItem}>
                            <img src={imageUrl} alt="Uploaded" class={styles.image} />
                            <button onClick={() => handleDelete(imageUrl)} class={styles.deleteButton}>Delete</button>
                        </div>
                    )}
                </For>
            </div>
        </div>
    );
}