
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { DashboardStats, Product, Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanBase64 = (base64Str: string) => {
  return base64Str.split(',')[1] || base64Str;
};

// AI'nın veri üzerinde işlem yapabilmesi için fonksiyon tanımları
const tools: { functionDeclarations: FunctionDeclaration[] }[] = [{
  functionDeclarations: [
    {
      name: 'delete_employee',
      parameters: {
        type: Type.OBJECT,
        description: 'İsmi verilen personeli sistemden kalıcı olarak siler.',
        properties: {
          fullName: {
            type: Type.STRING,
            description: 'Silinecek personelin tam adı veya sistemdeki adı.'
          }
        },
        required: ['fullName']
      }
    },
    {
      name: 'update_stock_quantity',
      parameters: {
        type: Type.OBJECT,
        description: 'Belirli bir ürünün stok miktarını günceller.',
        properties: {
          productName: { type: Type.STRING, description: 'Ürün adı' },
          newQuantity: { type: Type.NUMBER, description: 'Yeni stok miktarı' }
        },
        required: ['productName', 'newQuantity']
      }
    }
  ]
}];

export const getFinancialAdvice = async (
  stats: DashboardStats,
  lowStockItems: Product[],
  recentTransactions: Transaction[]
): Promise<string> => {
  const prompt = `
    Aşağıdaki şirket finansal verilerini analiz et ve bir yöneticiye 3 maddelik, kısa, net ve Türkçe tavsiyeler ver.
    Özet Durum:
    - Toplam Gelir: ${stats.totalIncome} TL
    - Toplam Gider: ${stats.totalExpense} TL
    - Net Kâr: ${stats.netProfit} TL
    - Kritik Stoktaki Ürün Sayısı: ${stats.lowStockCount}
    Kritik Stok Ürünleri: ${lowStockItems.map(i => i.name).join(', ')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Analiz yapılamadı.";
  } catch (error) {
    return "Yapay zeka bağlantısında bir hata oluştu.";
  }
};

export const chatWithAIAdvisor = async (userMessage: string, context: any) => {
    const prompt = `
      Sen Mustafa Ticaret'in uzman finansal danışmanısın. Şirket verileri şunlar:
      ${JSON.stringify(context)}
      
      Kullanıcı sorusu: ${userMessage}
      
      Eğer kullanıcı bir personeli çıkarmak (silmek) istiyorsa 'delete_employee' fonksiyonunu çağır.
      Eğer stok güncellemek istiyorsa 'update_stock_quantity' fonksiyonunu çağır.
      Yanıtını profesyonel ve Türkçe olarak ver.
    `;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: tools
        }
      });
      return response;
    } catch (e) {
      console.error(e);
      return null;
    }
};

export const analyzeReceipt = async (imageBase64: string): Promise<{ description: string, amount: number, date: string } | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(imageBase64) } },
          { text: "Fiş detaylarını çıkar: işyeri adı (description), toplam tutar (amount - sayı), tarih (date - YYYY-MM-DD)." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING }
          }
        }
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) { return null; }
};

export const editProductImage = async (imageBase64: string, prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64(imageBase64) } },
          { text: `Edit image: ${prompt}. Return image.` },
        ],
      },
    });
    if (response.candidates?.[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) { throw error; }
};
