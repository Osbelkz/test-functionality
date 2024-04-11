import styles from "./page.module.css";
import Flow from "@/components/Flow";
import {Button} from "antd";

export default function Home() {

    return (
        <main className={styles.main}>
            <div className={styles.content}>
                <Flow/>
            </div>
        </main>
    );
}
