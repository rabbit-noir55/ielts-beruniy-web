import { request } from "./api";

export async function getWritingFeedback({ taskPart, requirementText, essayText, image }) {
  try {
    const res = await request("/ai/feedback/", {
      method: "POST",
      body: {
        task_part: taskPart,
        requirement_text: requirementText,
        essay_text: essayText,
        image: image || null,
      },
    });
    if (res && res.data) return { success: true, data: res.data };
    return { success: false, error: "AI xizmati bo'sh javob qaytardi." };
  } catch (err) {
    return { success: false, error: err?.message || "AI xizmati ishlamayapti." };
  }
}

export async function imageUrlToBase64(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
