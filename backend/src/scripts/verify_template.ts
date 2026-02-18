
import { telinfyProvider } from '../providers/telinfy.provider';
import { whatsAppService } from '../services/whatsapp.service';
import axios from 'axios';

async function runVerification() {
    console.log("Starting verification...");

    const originalPost = axios.post;
    let lastPostCall: { url: string, data: any, config: any } | null = null;

    // Monkey patch axios.post
    // @ts-ignore
    axios.post = async (url: string, data: any, config: any) => {
        console.log(`[MockAxios] POST request to: ${url}`);
        lastPostCall = { url, data, config };
        return { data: { status: 'success', id: 'mock-id' } };
    };

    try {
        // Test Data based on Postman "Create Template - With Variables"
        const inputData = {
            name: "order_confirmation",
            category: "UTILITY",
            language: "en",
            label: "Order Confirmation Message",
            components: [
                {
                    "type": "BODY",
                    "text": "Hello {{1}}, your order {{2}} has been confirmed!",
                    "bodyExample": "John, #12345"
                }
            ]
        };

        const projectId = "test-project-id";

        // 1. Test WhatsAppService.createTemplate
        console.log("\nTesting WhatsAppService.createTemplate...");

        try {
            await whatsAppService.createTemplate(projectId, inputData);
        } catch (e: any) {
            // Expect db error or similar, but check if axios was called first
            console.log("Expected error (likely DB):", e.message);
        }

        if (lastPostCall) {
            const call = lastPostCall as { url: string, data: any, config: any };
            console.log("Captured API Call:");
            console.log("URL:", call.url);
            console.log("Payload:", JSON.stringify(call.data, null, 2));

            // Assertions
            const expectedUrl = "https://api.telinfy.net/gaca/template/create";
            if (call.url === expectedUrl) {
                console.log("✅ URL is correct.");
            } else {
                console.error(`❌ URL mismatch. Expected: ${expectedUrl}, Got: ${call.url}`);
            }

            if (call.data.components && call.data.components.length > 0) {
                console.log("✅ Payload contains components.");
            } else {
                console.error("❌ Payload missing components.");
            }
            if (call.data.label === inputData.label) {
                console.log("✅ Label passed correctly.");
            }
        } else {
            console.error("❌ No API call was made.");
        }

    } catch (error) {
        console.error("Verification failed with unexpected error:", error);
    } finally {
        // Restore axios
        axios.post = originalPost;
    }
}

runVerification();
