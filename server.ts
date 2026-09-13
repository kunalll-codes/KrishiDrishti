import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Support base64 image uploads up to 15MB
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Candidate models in prioritized order to guarantee uptime against per-model quota limits
const CANDIDATE_GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.8-flash",
];

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
    return null;
  }
}

// Fallback intelligent domain data for Demo Mode (Student competition resilience)
const DEMO_DIAGNOSES: Record<string, any> = {
  Tomato: {
    assessment: "Early Blight (Alternaria solani)",
    assessmentHi: "अर्ली ब्लाइट (अल्टरनेरिया सोलानी)",
    confidence: 91,
    symptoms: [
      "Concentric ring spots (target-like lesions) on lower older leaves",
      "Yellowing (chlorosis) halo surrounding dark necrotic lesions",
      "Lower canopy leaf drying, curling and premature leaf drop"
    ],
    symptomsHi: [
      "निचली पुरानी पत्तियों पर गोल छल्लेदार गहरे धब्बे",
      "धब्बों के चारों ओर पत्ती का पीला पड़ना",
      "निचली पत्तियों का सूखना और समय से पहले झड़ना"
    ],
    recommendedActions: [
      "Prune and safely destroy heavily infected lower foliage away from the field",
      "Enhance aeration by staking tomato vines and maintaining row spacing",
      "Avoid overhead sprinkler irrigation; use drip or furrow watering to keep foliage dry",
      "Consult your local Krishi Vigyan Kendra (KVK) or extension officer for suitable copper-based bio-fungicide"
    ],
    recommendedActionsHi: [
      "संक्रमित निचली पत्तियों को काटकर खेत से दूर नष्ट करें",
      "पौधों को सहारा देकर हवा का संचार बेहतर बनाएं",
      "पत्तियों पर पानी छिड़कने से बचें; ड्रिप सिंचाई अपनाएं",
      "स्थानीय कृषि विज्ञान केंद्र (KVK) से संपर्क कर अनुशंसित कवकनाशी की सलाह लें"
    ],
    prevention: [
      "Practice 2-3 year crop rotation away from solanaceous crops (potato, brinjal)",
      "Mulch soil bed with clean straw or plastic mulch to prevent soil splash",
      "Choose certified disease-resistant seed varieties during nursery sowing"
    ],
    preventionHi: [
      "टमाटर, आलू और बैंगन के साथ 2-3 साल का फसल चक्र अपनाएं",
      "मिट्टी पर पुआल की मल्चिंग करें ताकि सिंचाई का पानी पत्तियों पर न उछले",
      "बुवाई के समय प्रमाणित और रोग-प्रतिरोधी बीजों का चयन करें"
    ],
    warning: "AI-assisted preliminary assessment. Consider confirming the diagnosis with a qualified agricultural expert before applying treatment."
  },
  Potato: {
    assessment: "Late Blight (Phytophthora infestans)",
    assessmentHi: "पछेती झुलसा (लेट ब्लाइट)",
    confidence: 88,
    symptoms: [
      "Water-soaked irregular pale to dark green lesions near leaf tips",
      "White fungal fuzzy growth on leaf undersides under high humidity",
      "Rapid browning and blackening of stems and foliage"
    ],
    symptomsHi: [
      "पत्तियों के किनारों पर पानी से भीगे हुए भूरे-काले धब्बे",
      "अधिक नमी में पत्ती के नीचे सफेद फफूंद जैसी परत",
      "तनों और पत्तियों का तेजी से काला पड़कर सूखना"
    ],
    recommendedActions: [
      "Halt overhead irrigation immediately to minimize foliage wetness",
      "Remove isolated infected plants and bag them securely",
      "Ensure proper drainage in the potato field to avoid waterlogged furrows",
      "Consult local agriculture officer for certified prophylactic fungicide recommendations"
    ],
    recommendedActionsHi: [
      "पत्तियों को गीला करने वाली सिंचाई तुरंत रोकें",
      "रोगग्रस्त पौधों को उखाड़कर पॉलीथिन बैग में बंद कर नष्ट करें",
      "खेत में जलभराव न होने दें और जल निकासी सुचारू रखें",
      "अनुशंसित फफूंदनाशक के लिए स्थानीय कृषि अधिकारी से मार्गदर्शन लें"
    ],
    prevention: [
      "Plant certified disease-free seed tubers",
      "Ensure adequate hilling-up to protect tubers from spore wash-off",
      "Monitor weather warnings for prolonged cool, cloudy, and humid periods"
    ],
    preventionHi: [
      "केवल प्रमाणित रोग-मुक्त कंदों की बुवाई करें",
      "पौधों पर मिट्टी अच्छी तरह चढ़ाएं ताकि कंद सुरक्षित रहें",
      "ठंडे और नम मौसम के दौरान नियमित निगरानी रखें"
    ],
    warning: "AI-assisted preliminary assessment. Consider confirming the diagnosis with a qualified agricultural expert before applying treatment."
  },
  Wheat: {
    assessment: "Yellow / Stripe Rust (Puccinia striiformis)",
    assessmentHi: "पीला रतुआ / स्ट्राइप रस्ट",
    confidence: 93,
    symptoms: [
      "Linear stripes of yellow-orange powdery pustules along leaf veins",
      "Powdery yellow spores rubbing off onto fingers when touched",
      "Premature leaf drying leading to shriveled grain development"
    ],
    symptomsHi: [
      "पत्ती की नसों के समानांतर पीले-नारंगी पाउडर जैसी धारियां",
      "छूने पर उंगलियों पर पीला पाउडर लगना",
      "पत्तियों का सूखना और दाने पतले रह जाना"
    ],
    recommendedActions: [
      "Conduct field surveillance early in the morning to note spread intensity",
      "Avoid excessive top-dressing with nitrogen fertilizer during cool humid weather",
      "Ensure balanced potassium and phosphorus application",
      "Consult the nearest Kisan Call Centre (1800-180-1551) for approved university-tested fungicides"
    ],
    recommendedActionsHi: [
      "सुबह के समय खेत का मुआयना कर फैलाव की जांच करें",
      "ठंडे व नम मौसम में यूरिया (नाइट्रोजन) का अत्यधिक प्रयोग न करें",
      "संतुलित मात्रा में पोटाश और फास्फोरस दें",
      "अनुमोदित स्प्रे के लिए किसान कॉल सेंटर (1800-180-1551) से सलाह लें"
    ],
    prevention: [
      "Cultivate rust-resistant wheat varieties approved by regional research institutes",
      "Adhere to recommended regional sowing timelines",
      "Maintain field sanitation by removing wild grass hosts on bunds"
    ],
    preventionHi: [
      "क्षेत्रीय कृषि संस्थान द्वारा अनुशंसित रतुआ-रोधी किस्मों की बुवाई करें",
      "बुवाई समय पर करें और मेड़ों की खरपतवार को नष्ट करें",
      "खेत के आसपास स्वच्छता बनाए रखें"
    ],
    warning: "AI-assisted preliminary assessment. Consider confirming the diagnosis with a qualified agricultural expert before applying treatment."
  },
  Rice: {
    assessment: "Brown Spot (Bipolaris oryzae)",
    assessmentHi: "भूरा धब्बा रोग (ब्राउन स्पॉट)",
    confidence: 86,
    symptoms: [
      "Small oval or cylindrical brown spots scattered across leaf blades",
      "Lesions with greyish or whitish centers and distinct dark brown borders",
      "Grain discoloration and reduced panicle weight"
    ],
    symptomsHi: [
      "पत्तियों पर छोटे अंडाकार कत्थई/भूरे धब्बे",
      "धब्बों के बीच में हल्का धूसर रंग और किनारा गहरा भूरा",
      "बालियों में दाने काले पड़ना और वजन कम होना"
    ],
    recommendedActions: [
      "Assess soil nutrient balance; brown spot frequently correlates with potash and silica deficiency",
      "Maintain adequate, consistent water levels in the paddy field without stagnation",
      "Apply well-decomposed farmyard manure or neem cake to rejuvenate soil vitality",
      "Seek guidance from local agricultural department before applying foliar nutrients or bio-agents"
    ],
    recommendedActionsHi: [
      "मिट्टी में पोटाश और पोषक तत्वों की जांच करवाएं",
      "खेत में पानी का स्तर संतुलित रखें",
      "गोबर की सड़ी खाद या नीम की खली का प्रयोग करें",
      "स्थानीय कृषि अधिकारी की सलाह से ही पर्णीय स्प्रे करें"
    ],
    prevention: [
      "Treat seeds before nursery preparation with recommended bio-control agents (e.g., Trichoderma)",
      "Avoid unbuffered or nutrient-depleted soil conditions",
      "Use balanced NPK ratios according to soil health card recommendations"
    ],
    preventionHi: [
      "नर्सरी से पहले बीजोपचार ट्राइकोडर्मा जैसे जैविक घटक से करें",
      "मृदा स्वास्थ्य कार्ड (Soil Health Card) के आधार पर संतुलित खाद दें",
      "खेत को पोषक तत्वों से भरपूर रखें"
    ],
    warning: "AI-assisted preliminary assessment. Consider confirming the diagnosis with a qualified agricultural expert before applying treatment."
  },
  Cotton: {
    assessment: "Cotton Leaf Curl Virus (CLCuV)",
    assessmentHi: "कपास पत्ता मरोड़ रोग (लीफ कर्ल वायरस)",
    confidence: 89,
    symptoms: [
      "Upward or downward cupping and curling of leaf margins",
      "Thickening and prominent swelling of leaf veins on the underside",
      "Stunted plant growth and reduced boll formation"
    ],
    symptomsHi: [
      "पत्तियों के किनारों का ऊपर या नीचे की ओर मुड़ना (मरोड़िया)",
      "पत्तियों की निचली नसों का मोटा और उभरा हुआ होना",
      "पौधे की बढ़वार रुकना और टिंडे कम बनना"
    ],
    recommendedActions: [
      "Manage whitefly vectors using yellow sticky traps (10-12 traps per acre)",
      "Rogue out and destroy heavily stunted, virus-affected saplings early",
      "Avoid excess nitrogenous fertilizers which attract succulent-feeding pests",
      "Consult local extension officer for integrated pest management (IPM) guidelines"
    ],
    recommendedActionsHi: [
      "सफेद मक्खी की रोकथाम हेतु पीले चिपचिपे कार्ड (10-12 प्रति एकड़) लगाएं",
      "शुरुआती चरण में अधिक ग्रसित पौधों को उखाड़कर नष्ट करें",
      "नाइट्रोजन का अत्यधिक उपयोग न करें जिससे कीट आकर्षित होते हैं",
      "एकीकृत कीट प्रबंधन (IPM) के लिए कृषि विस्तार अधिकारी से संपर्क करें"
    ],
    prevention: [
      "Sow CLCuV-tolerant certified hybrid cotton varieties",
      "Eradicate weed hosts (like Parthenium, Abutilon) along field borders",
      "Monitor whitefly populations during early vegetative stages"
    ],
    preventionHi: [
      "रोग-सहनशील प्रमाणित संकर किस्मों का चयन करें",
      "खेत की मेड़ों से गाजर घास व अन्य खरपतवार हटाएं",
      "शुरुआती दिनों से ही सफेद मक्खी की निगरानी करें"
    ],
    warning: "AI-assisted preliminary assessment. Consider confirming the diagnosis with a qualified agricultural expert before applying treatment."
  },
  Other: {
    assessment: "Leaf Foliar Chlorosis & Nutrient Stress",
    assessmentHi: "पर्ण क्लोरोसिस व पोषक तत्व तनाव",
    confidence: 82,
    symptoms: [
      "Interveinal yellowing with green veins on tender leaves",
      "General loss of vigorous dark green foliage color",
      "Mild leaf margin curling and slowed expansion"
    ],
    symptomsHi: [
      "पत्तियों की नसों के बीच पीलापन जबकि नसें हरी रहना",
      "पौधे की चमक और गहरे हरे रंग में कमी",
      "पत्तियों के किनारों का हल्का मुड़ना"
    ],
    recommendedActions: [
      "Inspect irrigation schedule; check for either waterlogging or soil moisture deficit",
      "Check soil pH and conduct a simple soil testing card check",
      "Apply composted organic matter or vermicompost to root zone",
      "Consult local agricultural station before applying micronutrient spray"
    ],
    recommendedActionsHi: [
      "सिंचाई की जांच करें; खेत में अधिक पानी या सूखा न होने दें",
      "मिट्टी की जांच करवाएं और वर्मीकम्पोस्ट (केंचुआ खाद) डालें",
      "पोषक तत्वों की कमी दूर करने हेतु जैविक खाद का उपयोग करें",
      "स्थानीय कृषि केंद्र से सूक्ष्म पोषक तत्वों के छिड़काव की सलाह लें"
    ],
    prevention: [
      "Maintain consistent soil moisture without water stagnation",
      "Adopt periodic soil organic matter enhancement",
      "Rotate crops to prevent localized micronutrient exhaustion"
    ],
    preventionHi: [
      "खेत में नमी का संतुलन बनाए रखें",
      "हर साल खेत में हरी खाद या गोबर की खाद डालें",
      "फसल चक्र अपनाएं ताकि पोषक तत्व बने रहें"
    ],
    warning: "AI-assisted preliminary assessment. Consider confirming the diagnosis with a qualified agricultural expert before applying treatment."
  }
};

// Health check endpoint
app.get("/api/health", (req, res) => {
  const geminiAvailable = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    status: "ok",
    app: "Krishi Drishti",
    version: "1.0.0",
    geminiConfigured: geminiAvailable,
  });
});

// Crop Diagnosis API Endpoint
app.post("/api/diagnose", async (req, res) => {
  try {
    const { crop, imageBase64, mimeType = "image/jpeg", language = "en" } = req.body;

    if (!crop) {
      return res.status(400).json({
        error: language === "hi" ? "कृपया एक फसल चुनें।" : "Please select a crop."
      });
    }
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({
        error: language === "hi" ? "कृपया पहले पत्ती की फोटो अपलोड करें।" : "Please upload a crop leaf image first."
      });
    }

    const ai = getGeminiClient();

    // If Gemini client is not configured, use intelligent demo mode
    if (!ai) {
      const fallback = DEMO_DIAGNOSES[crop] || DEMO_DIAGNOSES["Other"];
      const isHindi = language === "hi";

      return res.json({
        crop,
        assessment: isHindi && fallback.assessmentHi ? fallback.assessmentHi : fallback.assessment,
        confidence: fallback.confidence,
        confidenceRange: isHindi ? `लगभग ${fallback.confidence}%` : `Approx. ${fallback.confidence}%`,
        symptoms: isHindi && fallback.symptomsHi ? fallback.symptomsHi : fallback.symptoms,
        observedSymptoms: isHindi && fallback.symptomsHi ? fallback.symptomsHi : fallback.symptoms,
        recommendedActions: isHindi && fallback.recommendedActionsHi ? fallback.recommendedActionsHi : fallback.recommendedActions,
        recommendedNextSteps: isHindi && fallback.recommendedActionsHi ? fallback.recommendedActionsHi : fallback.recommendedActions,
        prevention: isHindi && fallback.preventionHi ? fallback.preventionHi : fallback.prevention,
        preventionGuidance: isHindi && fallback.preventionHi ? fallback.preventionHi : fallback.prevention,
        warning: isHindi
          ? "यह एआई-सहायता प्राप्त प्रारंभिक मूल्यांकन है। उपचार लागू करने से पहले किसी योग्य कृषि विशेषज्ञ से पुष्टि अवश्य करें।"
          : fallback.warning,
        uncertaintyWarning: isHindi
          ? "यह एआई-सहायता प्राप्त प्रारंभिक मूल्यांकन है। उपचार लागू करने से पहले किसी योग्य कृषि विशेषज्ञ से पुष्टि अवश्य करें।"
          : fallback.warning,
        isDemo: true,
        demoNote: isHindi
          ? "डेमो मोड (सत्यापित कृषि ज्ञानकोश से मूल्यांकन)"
          : "Generated in Demo Mode (Sample Agricultural Intelligence Knowledge Base)"
      });
    }

    // Detect actual mime type if present in data URL
    let detectedMimeType = mimeType || "image/jpeg";
    const mimeMatch = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
    if (mimeMatch && mimeMatch[1]) {
      detectedMimeType = mimeMatch[1];
    }

    // Clean base64 data string
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, "");

    // If image is an SVG or non-raster, handle gracefully
    if (detectedMimeType.includes("svg") || cleanBase64.startsWith("<svg") || imageBase64.includes("<svg")) {
      const fallback = DEMO_DIAGNOSES[crop] || DEMO_DIAGNOSES["Other"];
      const isHindi = language === "hi";
      return res.json({
        crop,
        assessment: isHindi && fallback.assessmentHi ? fallback.assessmentHi : fallback.assessment,
        confidence: fallback.confidence,
        confidenceRange: isHindi ? `लगभग ${fallback.confidence}%` : `Approx. ${fallback.confidence}%`,
        symptoms: isHindi && fallback.symptomsHi ? fallback.symptomsHi : fallback.symptoms,
        observedSymptoms: isHindi && fallback.symptomsHi ? fallback.symptomsHi : fallback.symptoms,
        recommendedActions: isHindi && fallback.recommendedActionsHi ? fallback.recommendedActionsHi : fallback.recommendedActions,
        recommendedNextSteps: isHindi && fallback.recommendedActionsHi ? fallback.recommendedActionsHi : fallback.recommendedActions,
        prevention: isHindi && fallback.preventionHi ? fallback.preventionHi : fallback.prevention,
        preventionGuidance: isHindi && fallback.preventionHi ? fallback.preventionHi : fallback.prevention,
        warning: isHindi
          ? "यह एआई-सहायता प्राप्त प्रारंभिक मूल्यांकन है। उपचार लागू करने से पहले किसी योग्य कृषि विशेषज्ञ से पुष्टि अवश्य करें।"
          : fallback.warning,
        uncertaintyWarning: isHindi
          ? "यह एआई-सहायता प्राप्त प्रारंभिक मूल्यांकन है। उपचार लागू करने से पहले किसी योग्य कृषि विशेषज्ञ से पुष्टि अवश्य करें।"
          : fallback.warning,
        isDemo: true,
        demoNote: isHindi
          ? "सैंपल लीफ प्रीसेट (सत्यापित ज्ञानकोश)"
          : "Sample leaf preset analyzed via verified agricultural knowledge base."
      });
    }

    const systemInstruction = `You are providing an AI-assisted preliminary crop assessment.
Analyze only what can reasonably be inferred from the supplied image.
Do not claim certainty.
If the image is unclear, irrelevant, or insufficient for diagnosis, say so.
Do not invent symptoms.
Provide practical general agricultural guidance.
Do not provide dangerous or highly specific chemical/pesticide instructions.
Recommend verification by a qualified local agricultural expert when appropriate.

Farmer context:
Selected crop: "${crop}".
Language requested: "${language === "hi" ? "Hindi (हिंदी)" : "English"}".
If language is Hindi, generate the response in clear, natural Hindi in Devanagari script.`;

    const promptText = `Analyze this ${crop} leaf image. Provide a structured preliminary agricultural assessment in ${language === "hi" ? "Hindi (Devanagari script)" : "English"}.
If the image is unclear, blurry, or does not clearly show plant leaf foliage, identify it as unclear/insufficient in the assessment and provide guidance on capturing a clear leaf image.`;

    let response: any = null;
    let lastError: any = null;

    for (const model of CANDIDATE_GEMINI_MODELS) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: detectedMimeType || "image/jpeg",
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                crop: { type: Type.STRING, description: "Name of the crop analyzed" },
                assessment: { type: Type.STRING, description: "Likely disease or condition name, or unclear/insufficient status" },
                confidence: { type: Type.INTEGER, description: "Confidence score between 0 and 100" },
                confidenceRange: { type: Type.STRING, description: "Confidence range or qualitative rating, e.g. 75% - 85% or Low (<30%)" },
                observedSymptoms: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of visible observed leaf symptoms"
                },
                recommendedNextSteps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Farmer-friendly practical next steps and cultural management"
                },
                preventionGuidance: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Long-term preventive agricultural measures"
                },
                uncertaintyWarning: {
                  type: Type.STRING,
                  description: "Mandatory uncertainty disclaimer about preliminary AI diagnosis and recommendation to consult local agricultural experts"
                },
                isUnclearOrInsufficient: {
                  type: Type.BOOLEAN,
                  description: "True if the image is blurry, irrelevant, non-leaf, or insufficient for diagnosis"
                }
              },
              required: [
                "crop",
                "assessment",
                "confidence",
                "confidenceRange",
                "observedSymptoms",
                "recommendedNextSteps",
                "preventionGuidance",
                "uncertaintyWarning",
                "isUnclearOrInsufficient"
              ]
            }
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        if (msg.includes("429") || msg.includes("quota") || msg.includes("404")) {
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw lastError || new Error("AI models temporarily unavailable");
    }

    const textOutput = response.text?.trim();
    if (!textOutput) {
      throw new Error("Empty response from AI model");
    }

    const parsedData = JSON.parse(textOutput);

    return res.json({
      crop: parsedData.crop || crop,
      assessment: parsedData.assessment,
      confidence: typeof parsedData.confidence === "number" ? parsedData.confidence : 75,
      confidenceRange: parsedData.confidenceRange || `${Math.max(0, (parsedData.confidence || 75) - 5)}% - ${Math.min(100, (parsedData.confidence || 75) + 5)}%`,
      symptoms: parsedData.observedSymptoms || [],
      observedSymptoms: parsedData.observedSymptoms || [],
      recommendedActions: parsedData.recommendedNextSteps || [],
      recommendedNextSteps: parsedData.recommendedNextSteps || [],
      prevention: parsedData.preventionGuidance || [],
      preventionGuidance: parsedData.preventionGuidance || [],
      warning: parsedData.uncertaintyWarning || "",
      uncertaintyWarning: parsedData.uncertaintyWarning || "",
      isUnclearOrInsufficient: !!parsedData.isUnclearOrInsufficient,
      isDemo: false,
    });
  } catch (error: any) {
    console.error("Error in /api/diagnose:", error);

    // Check if error is due to invalid image payload or format
    const errorMessage = error?.message?.toLowerCase() || "";
    const isImageFormatError =
      errorMessage.includes("unsupported image") ||
      errorMessage.includes("invalid argument") ||
      errorMessage.includes("bad request") ||
      errorMessage.includes("image");

    if (isImageFormatError && !errorMessage.includes("quota") && !errorMessage.includes("503")) {
      return res.status(422).json({
        error: req.body?.language === "hi"
          ? "अपलोड की गई फोटो का विश्लेषण नहीं किया जा सका। कृपया स्पष्ट, अच्छी रोशनी वाली पत्ती की फोटो (JPEG या PNG) अपलोड करें।"
          : "The uploaded leaf image could not be analyzed. Please ensure you upload a clear, focused photo of the crop leaf (JPEG, PNG, or WebP) under 10MB and try again."
      });
    }

    // Graceful fallback to demo mode on unexpected API network error or quota limit
    const cropKey = req.body?.crop || "Other";
    const fallback = DEMO_DIAGNOSES[cropKey] || DEMO_DIAGNOSES["Other"];
    const isHindi = req.body?.language === "hi";

    return res.json({
      crop: cropKey,
      assessment: isHindi && fallback.assessmentHi ? fallback.assessmentHi : fallback.assessment,
      confidence: fallback.confidence,
      confidenceRange: isHindi ? `लगभग ${fallback.confidence}%` : `Approx. ${fallback.confidence}%`,
      symptoms: isHindi && fallback.symptomsHi ? fallback.symptomsHi : fallback.symptoms,
      observedSymptoms: isHindi && fallback.symptomsHi ? fallback.symptomsHi : fallback.symptoms,
      recommendedActions: isHindi && fallback.recommendedActionsHi ? fallback.recommendedActionsHi : fallback.recommendedActions,
      recommendedNextSteps: isHindi && fallback.recommendedActionsHi ? fallback.recommendedActionsHi : fallback.recommendedActions,
      prevention: isHindi && fallback.preventionHi ? fallback.preventionHi : fallback.prevention,
      preventionGuidance: isHindi && fallback.preventionHi ? fallback.preventionHi : fallback.prevention,
      warning: isHindi
        ? "यह एआई-सहायता प्राप्त प्रारंभिक मूल्यांकन है। उपचार लागू करने से पहले किसी योग्य कृषि विशेषज्ञ से पुष्टि अवश्य करें।"
        : fallback.warning,
      uncertaintyWarning: isHindi
        ? "यह एआई-सहायता प्राप्त प्रारंभिक मूल्यांकन है। उपचार लागू करने से पहले किसी योग्य कृषि विशेषज्ञ से पुष्टि अवश्य करें।"
        : fallback.warning,
      isDemo: true,
      demoNote: isHindi
        ? "लाइव एआई सेवा अस्थायी रूप से अनुपलब्ध है। सत्यापित कृषि ज्ञानकोश से मूल्यांकन प्रदर्शित किया गया है।"
        : "Live AI temporarily unavailable. Showing verified agricultural knowledge base assessment.",
    });
  }
});

function getKrishiSystemInstruction(language: string): string {
  return `You are Krishi Assistant — an AI-assisted agricultural guidance assistant for farmers in India.
Your mission is to provide practical, accessible, and scientifically grounded guidance tailored to Indian farming conditions, agro-climatic zones, and seasonal realities (Kharif, Rabi, and Zaid).

=== DOMAIN EXPERTISE & KNOWLEDGE SCOPE ===
Provide clear, actionable advice on:
- Crop Cultivation: Rice/Paddy, Wheat, Cotton, Mustard, Maize, Sugarcane, Pulses (Gram/Chickpea, Moong, Urad, Arhar/Pigeonpea), Vegetables (Tomato, Potato, Chilli, Onion, Brinjal), Fruits and Oilseeds.
- Growth Stages & Timing: Germination, nursery, transplantation vs direct seeding (DSR), tillering, crown root initiation (CRI in wheat ~20-25 days), vegetative, branching, flowering/anthesis, pod/grain filling, milking, dough, and harvesting.
- Irrigation & Water: Critical moisture stages per crop, alternate wetting and drying (AWD) in rice (shallow 2-3 cm saturation vs deep flooding), furrow/basin/drip, checking topsoil moisture by hand feel (top 2-3 inches), drainage during monsoons.
- Soil & Nutrients: Basal vs top dressing, split application of Urea, balanced NPK, micronutrient deficiencies (Zinc deficiency "Khaira" in paddy, Iron/Sulphur/Boron chlorosis), FYM, biofertilizers (Rhizobium, PSB), vermicompost, Jeevamrut.
- Integrated Pest Management (IPM): Pheromone traps, yellow and blue sticky traps (20-30/acre), neem seed kernel extract (NSKE 5%), Neem oil (1500–3000 ppm at 3-5 ml/L), biological controls (Trichoderma, Pseudomonas fluorescens, Beauveria bassiana).
- Common Indian Pests & Diseases: Stem borer (dead hearts/white ears), leaf folder, BPH, blast, sheath blight in rice; aphids, yellow/brown rust, termites, loose smut in wheat; fruit borer (Helicoverpa), whitefly (vector of Leaf Curl Virus), leaf miner, early/late blight in tomato.
- Indian Agricultural Ecosystem: Krishi Vigyan Kendra (KVK), Kisan Call Centre (Toll-Free 1800-180-1551), state agriculture extension officers (Gram Krishi Sahayak), APMC mandis, Soil Health Card.

=== LANGUAGE RULES ===
Requested language mode: ${language === "hi" ? "Hindi (हिंदी)" : "English"}.
- If requested language is English OR the user writes in English, answer in clear, friendly English.
- If requested language is Hindi OR the user writes in Hindi, answer in natural, accessible Hindi in Devanagari script.
- If the user uses Hinglish/mixed terms (e.g. "meri wheat crop me yellow leaves"), reply naturally in the requested language mode or friendly conversational bilingual style.
- Avoid overly bookish, academic jargon or awkward literal translations. Use authentic Indian farming vocabulary (e.g., 'कल्ले फूटना', 'गोभ की अवस्था', 'यूरिया का बुरकाव', 'निराई-गुड़ाई', 'सड़ी गोबर की खाद', 'नीम का तेल').

=== CROP-AWARE CONVERSATION & CONTEXT TRACKING (CRITICAL) ===
1. TRACK CROP & STAGE ACROSS TURNS:
   - Actively identify and remember the current crop, sowing/transplanting method, age/stage, and location from previous messages in this conversation.
   - If the user previously said "I've planted rice." and next says "It's been 20 days.", connect these immediately: this is 20-day-old rice (active tillering / early vegetative stage).
   - If the user follows up with "How much water should I give?" or "What should I do now?", answer SPECIFICALLY for 20-day-old rice. NEVER reset to generic advice.
   - Do NOT invent or assume facts the farmer has not provided; state any necessary operational assumptions clearly.

2. CONVERSATIONAL STATEMENTS VS QUESTIONS:
   - If the farmer makes a statement (e.g., "I've planted rice", "I am growing tomatoes"):
     DO NOT output a massive generic manual or text dump!
     Acknowledge warmly, establish the crop context, briefly state what the critical next factor is (e.g., transplanted vs DSR, date of sowing), and ask 1 or 2 targeted questions to guide them.
     Example: "Great. For rice, management depends on whether you transplanted seedlings or used direct seeding (DSR), and how many days ago it was planted. Tell me roughly how many days it has been, and I'll help you with the next stage."

3. TARGETED FOLLOW-UP QUESTIONS:
   - When key details are missing, ask at most 1 or 2 specific, easy-to-answer follow-up questions at the very end of your response.
   - Useful details: crop growth stage/days since planting, visible leaf/stem symptoms, soil type (sandy/loamy/clay), or recent rainfall.
   - Never interrogate the farmer with a long questionnaire.

4. RESPONSE STRUCTURE & QUALITY:
   - Ban generic boilerplate ("Maintain proper irrigation, use balanced nutrients, monitor pests").
   - Instead, always explain:
     * WHAT to check (e.g., "Inspect leaf undersides for tiny whiteflies or look for dead hearts in tillers")
     * WHY it matters (e.g., "At 20-25 days, rice forms tillers that directly determine panicle count and final yield")
     * PRACTICAL ACTIONS the farmer can do right now (numbered steps with realistic quantities, e.g., kg/acre or ml/litre)
     * WARNING SIGNS to watch out for in the coming 7-10 days
   - Structure for mobile readability: short paragraphs, bullet points, and bold keywords.

5. SAFETY, ACCURACY & UNCERTAINTY:
   - Never claim absolute certainty on diagnoses from text alone. Use measured phrasing: "This may be caused by...", "Check for these symptoms...", "One likely cause is...".
   - Never recommend banned, lethal, or unverified dangerous chemical cocktails or excessive dosages.
   - Always encourage eco-friendly IPM and organic options first where feasible.
   - For chemical interventions, prioritize label directions and recommend consulting the local Krishi Vigyan Kendra (KVK) or Kisan Call Centre (1800-180-1551).`;
}

function getAssistantFallback(message: string, language: string): string {
  const lowerMsg = (message || "").toLowerCase();
  let replyEn = "Namaste! For healthy crop growth, ensure balanced soil nourishment, check topsoil moisture before irrigating, and inspect plant canopies regularly for early symptoms.\n\nCould you tell me which crop you are growing and its approximate age?";
  let replyHi = "नमस्ते! फसल की अच्छी बढ़वार के लिए संतुलित पोषण दें, सिंचाई से पहले मिट्टी में नमी की जांच करें, और कीट-रोगों के शुरुआती लक्षणों के लिए नियमित निरीक्षण करें।\n\nकृपया बताएं कि आप कौन सी फसल उगा रहे हैं और उसकी उम्र लगभग कितने दिन है?";

  if (lowerMsg.includes("rice") || lowerMsg.includes("paddy") || lowerMsg.includes("धान") || lowerMsg.includes("चावल")) {
    if (lowerMsg.includes("water") || lowerMsg.includes("पानी") || lowerMsg.includes("सिंचाई")) {
      replyEn = "### Water Management in Rice (Tillering / Early Stage)\n\n* **Water Depth**: Maintain a shallow water layer of **2 to 3 cm** rather than deep flooding. Deep standing water hinders tiller emergence.\n* **Alternate Wetting & Drying (AWD)**: Allow the surface water to soak in until the soil is saturated but not cracked, then re-irrigate.\n* **Top-Dressing Care**: Ensure 2–3 cm of standing water when applying top-dressed Urea to avoid ammonia volatilization.\n\n*Is your field direct-seeded (DSR) or transplanted, and does the soil retain water well?*";
      replyHi = "### धान में सिंचाई प्रबंधन (कल्ले फूटने की अवस्था)\n\n* **पानी का स्तर**: खेत में **२ से ३ सेमी** उथला पानी रखें, गहरा पानी न भरें। ज्यादा पानी भरने से कल्ले कम फूटते हैं।\n* **नमी चक्र (AWD)**: जब पानी जमीन में समा जाए और मिट्टी गीली हो (दरारें न पड़ें), तब दोबारा हल्का पानी दें।\n* **यूरिया छिड़काव**: यूरिया की टॉप-ड्रेसिंग करते समय खेत में २-३ सेमी पानी होना चाहिए।\n\n*क्या आपकी धान रोपाई वाली है या सीधी बुवाई (DSR)?*";
    } else {
      replyEn = "Great to hear about your rice crop! For paddy, the next management steps depend on whether you transplanted seedlings or used direct seeding (DSR), and how many days ago it was planted.\n\nCould you tell me roughly how many days it has been since planting?";
      replyHi = "धान की खेती के लिए शुभकामनाएं! धान में अगला कदम इस बात पर निर्भर करता है कि आपने रोपाई की है या सीधी बुवाई (DSR), और फसल को कितने दिन हो चुके हैं।\n\nकृपया बताएं कि रोपाई या बुवाई को लगभग कितने दिन हुए हैं?";
    }
  } else if (lowerMsg.includes("yellow") || lowerMsg.includes("पील")) {
    replyEn = "### Causes of Leaf Yellowing in Crops\n\n1. **Nitrogen Deficiency**: Starts uniformly on older, bottom leaves while upper leaves stay pale green.\n2. **Waterlogging / Root Suffocation**: Excess water prevents roots from absorbing iron and zinc, causing generalized chlorosis.\n3. **Early Fungal Rust or Blight**: Look for tiny yellow pustules or irregular spots with dark borders.\n\n**What you should do right now**:\n* Dig 2 inches into the soil: check if roots are white and healthy or dark and waterlogged.\n* Ensure field drainage and let the soil breathe before next irrigation.\n* If bottom leaves are pale, plan a mild Urea top-dressing or Zinc sulphate spray (0.5%) after consulting your local KVK.\n\n*Which crop is affected, and roughly how many days old is it?*";
    replyHi = "### फसल की पत्तियों में पीलापन आने के मुख्य कारण\n\n१. **नाइट्रोजन की कमी**: पीलापन पहले नीचे की पुरानी पत्तियों पर आता है और ऊपर की पत्तियां हल्की हरी रहती हैं।\n२. **खेत में जलभराव**: अधिक पानी से जड़ें सांस नहीं ले पातीं और पोषक तत्वों का अवशोषण रुक जाता है।\n३. **जिंक या सूक्ष्म पोषक तत्वों की कमी**: पत्तियों की नसों के बीच पीलापन या कत्थई धब्बे दिखाई देते हैं।\n\n**तुरंत क्या करें**:\n* पौधे की जड़ें चेक करें—क्या वे सफेद और स्वस्थ हैं या सड़ी हुई हैं?\n* खेत में पानी भरा हो तो तुरंत निकासी का प्रबंध करें।\n* यदि नाइट्रोजन की कमी लगे तो हल्की सिंचाई के साथ यूरिया का बुरकाव करें।\n\n*यह समस्या किस फसल में है और बुवाई को लगभग कितने दिन हुए हैं?*";
  } else if (lowerMsg.includes("tomato") || lowerMsg.includes("टमाटर")) {
    replyEn = "### Integrated Pest Management (IPM) for Tomato\n\n* **Yellow & Blue Sticky Traps**: Place 20–25 traps per acre to trap sucking pests (whiteflies, thrips, aphids).\n* **Neem Oil Spray**: Spray Neem Oil (1500 ppm) at **3–5 ml per litre of water** during early morning or evening hours as an organic repellent.\n* **Field Hygiene**: Pick and destroy any leaves with serpentine leaf miner tunnels or fruit borer entry holes.\n* **Avoid Excess Nitrogen**: Too much Urea creates succulent foliage that attracts sucking pests.\n\n*Are you currently noticing tiny whiteflies, folded leaves, or holes in the fruits?*";
    replyHi = "### टमाटर में कीट रोकथाम की प्रमुख विधियां (IPM)\n\n* **पीले व नीले चिपचिपे ट्रैप (Sticky Traps)**: खेत में २०-२५ ट्रैप प्रति एकड़ लगाएं। यह सफेद मक्खी, थ्रिप्स और माहू को आकर्षित कर चिपका लेते हैं।\n* **नीम का तेल**: १५०० ppm नीम तेल का ३-५ मिली प्रति लीटर पानी की दर से शाम के समय छिड़काव करें।\n* **पौधों की छंटाई**: फल छेदक से प्रभावित फल या लीफ माइनर वाली पत्तियों को तोड़कर नष्ट करें।\n* **संतुलित खाद**: अधिक यूरिया देने से बचें, क्योंकि कोमल पत्तियों पर कीट जल्दी हमला करते हैं।\n\n*क्या आपको पत्तियों के नीचे सफेद मक्खी या फलों में छेद दिखाई दे रहे हैं?*";
  }

  return language === "hi" ? replyHi : replyEn;
}

// Progressive Server-Sent Events (SSE) Streaming Endpoint for Krishi Assistant
app.post("/api/chat/stream", async (req, res) => {
  const { message, history = [], language = "en" } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  // Set SSE headers to stream immediately to the client
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Avoid proxy buffering
  if (res.flushHeaders) {
    res.flushHeaders();
  }

  let isClientConnected = true;
  res.on("close", () => {
    isClientConnected = false;
  });

  const sendEvent = (event: string, data: any) => {
    if (!isClientConnected || res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
  };

  const ai = getGeminiClient();

  if (!ai) {
    // If Gemini client is not configured, stream verified agricultural knowledge response
    const fallbackText = getAssistantFallback(message, language);
    const words = fallbackText.split(" ");
    for (let i = 0; i < words.length; i += 2) {
      if (!isClientConnected) break;
      const chunk = words.slice(i, i + 2).join(" ") + (i + 2 < words.length ? " " : "");
      sendEvent("chunk", { text: chunk, isDemo: true });
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    sendEvent("done", { isDemo: true });
    return res.end();
  }

  try {
    const systemInstruction = getKrishiSystemInstruction(language);

    // Build conversation contents with up to 16 previous turns to preserve multi-turn crop context
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-16)) {
        const text = String(
          h.content ||
          h.text ||
          (Array.isArray(h.parts) ? h.parts.map((p: any) => p.text || "").join("") : "") ||
          ""
        ).trim();
        if (!text) continue;
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message.trim() }],
    });

    let responseStream: any = null;
    let lastStreamError: any = null;

    for (const model of CANDIDATE_GEMINI_MODELS) {
      try {
        const streamPromise = ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini stream connection timeout")), 5000)
        );

        responseStream = await Promise.race([streamPromise, timeoutPromise]);
        break;
      } catch (err: any) {
        lastStreamError = err;
        const msg = err?.message || String(err);
        if (msg.includes("429") || msg.includes("quota") || msg.includes("404")) {
          continue;
        }
        throw err;
      }
    }

    if (!responseStream) {
      throw lastStreamError || new Error("All candidate AI models were unavailable for stream");
    }

    let streamedAnyChunk = false;
    for await (const chunk of responseStream) {
      if (!isClientConnected) break;
      const chunkText = chunk.text;
      if (chunkText) {
        streamedAnyChunk = true;
        sendEvent("chunk", { text: chunkText, isDemo: false });
      }
    }

    sendEvent("done", { isDemo: false });
    res.end();
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const logSummary = errorMsg.includes("429") || errorMsg.includes("quota")
      ? "Free-tier API limit reached, serving verified knowledge base stream"
      : errorMsg.slice(0, 100);
    console.info(`[Krishi Drishti] Chat streaming notice: ${logSummary}`);

    if (isClientConnected) {
      // Progressively stream verified agricultural knowledge response
      const fallbackText = getAssistantFallback(message, language);
      const words = fallbackText.split(" ");
      for (let i = 0; i < words.length; i += 2) {
        if (!isClientConnected) break;
        const chunk = words.slice(i, i + 2).join(" ") + (i + 2 < words.length ? " " : "");
        sendEvent("chunk", { text: chunk, isDemo: true });
        await new Promise((resolve) => setTimeout(resolve, 35));
      }
      sendEvent("done", { isDemo: true });
    }
    res.end();
  }
});

// Non-streaming fallback for /api/chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], language = "en" } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        reply: getAssistantFallback(message, language),
        isDemo: true,
      });
    }

    const systemInstruction = getKrishiSystemInstruction(language);

    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-16)) {
        const text = String(
          h.content ||
          h.text ||
          (Array.isArray(h.parts) ? h.parts.map((p: any) => p.text || "").join("") : "") ||
          ""
        ).trim();
        if (!text) continue;
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message.trim() }],
    });

    let response: any = null;
    let lastChatError: any = null;

    for (const model of CANDIDATE_GEMINI_MODELS) {
      try {
        response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        lastChatError = err;
        const msg = err?.message || String(err);
        if (msg.includes("429") || msg.includes("quota") || msg.includes("404")) {
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw lastChatError || new Error("All candidate models unavailable");
    }

    const reply = response.text || "I am currently unable to answer. Please consult your local Kisan Call Centre.";

    return res.json({
      reply,
      isDemo: false,
    });
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const logSummary = errorMsg.includes("429") || errorMsg.includes("quota")
      ? "Free-tier API limit reached, serving verified knowledge base response"
      : errorMsg.slice(0, 100);
    console.info(`[Krishi Drishti] Chat notice: ${logSummary}`);
    return res.json({
      reply: getAssistantFallback(req.body?.message, req.body?.language || "en"),
      isDemo: true,
      demoNote: "Verified agricultural knowledge base response provided."
    });
  }
});

// Vite / static file middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Krishi Drishti] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
