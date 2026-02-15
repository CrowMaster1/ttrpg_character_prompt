/**
 * Guide for using prompts with free online AI image generators
 */

export function FreeModelGuide() {
  return (
    <div className="free-model-guide">
      <h3>🆓 Free Online AI Image Generators</h3>
      <p className="guide-intro">
        Use these prompt formats with popular free image generation services:
      </p>

      <div className="model-recommendations">
        {/* SORA */}
        <div className="model-card">
          <h4>🎬 OpenAI SORA / DALL-E 3</h4>
          <div className="recommendation">
            <strong>Best Format:</strong> <span className="format-badge">FLUX</span>
          </div>
          <p className="why">
            SORA and DALL-E 3 work best with natural language descriptions.
            Use complete sentences that describe the scene clearly.
          </p>
          <div className="tips">
            <strong>Tips:</strong>
            <ul>
              <li>✓ Use descriptive sentences</li>
              <li>✓ Include lighting and mood</li>
              <li>✓ Avoid weighted keywords like (word:1.2)</li>
              <li>✓ Keep under 256 tokens</li>
            </ul>
          </div>
        </div>

        {/* Google Gemini */}
        <div className="model-card">
          <h4>🌟 Google Gemini / Imagen 3</h4>
          <div className="recommendation">
            <strong>Best Format:</strong> <span className="format-badge">FLUX</span>
          </div>
          <p className="why">
            Gemini's Imagen 3 understands natural language extremely well.
            Write prompts as if describing the image to a person.
          </p>
          <div className="tips">
            <strong>Tips:</strong>
            <ul>
              <li>✓ Natural language descriptions</li>
              <li>✓ Be specific about details</li>
              <li>✓ Include style and atmosphere</li>
              <li>✓ Avoid technical syntax</li>
            </ul>
          </div>
        </div>

        {/* Leonardo.AI */}
        <div className="model-card">
          <h4>🎨 Leonardo.AI</h4>
          <div className="recommendation">
            <strong>Best Format:</strong> <span className="format-badge">SDXL</span> or <span className="format-badge">SD1.5</span>
          </div>
          <p className="why">
            Leonardo uses Stable Diffusion models. SDXL format with weighted
            keywords works excellently here.
          </p>
          <div className="tips">
            <strong>Tips:</strong>
            <ul>
              <li>✓ Use (keyword:1.2) weights for emphasis</li>
              <li>✓ Comma-separated keywords work well</li>
              <li>✓ Try different models (Leonardo, DreamShaper)</li>
              <li>✓ Keep prompts concise (under 77 tokens)</li>
            </ul>
          </div>
        </div>

        {/* Ideogram */}
        <div className="model-card">
          <h4>💡 Ideogram</h4>
          <div className="recommendation">
            <strong>Best Format:</strong> <span className="format-badge">FLUX</span>
          </div>
          <p className="why">
            Ideogram excels at natural language and text rendering.
            Natural sentences produce the best results.
          </p>
          <div className="tips">
            <strong>Tips:</strong>
            <ul>
              <li>✓ Descriptive natural language</li>
              <li>✓ Great for text in images</li>
              <li>✓ Specify art style clearly</li>
              <li>✓ Works well with detailed scenes</li>
            </ul>
          </div>
        </div>

        {/* Midjourney */}
        <div className="model-card">
          <h4>🖼️ Midjourney (Free Trial)</h4>
          <div className="recommendation">
            <strong>Best Format:</strong> <span className="format-badge">FLUX</span> or <span className="format-badge">SD1.5</span>
          </div>
          <p className="why">
            Midjourney understands both natural language and keyword-based prompts.
            Mix of both works well.
          </p>
          <div className="tips">
            <strong>Tips:</strong>
            <ul>
              <li>✓ Descriptive keywords with style tags</li>
              <li>✓ Add --ar 16:9 for aspect ratio</li>
              <li>✓ Use --stylize 100-1000 for artistic control</li>
              <li>✓ Avoid excessive commas</li>
            </ul>
          </div>
        </div>

        {/* Bing Image Creator */}
        <div className="model-card">
          <h4>🔍 Bing Image Creator (DALL-E)</h4>
          <div className="recommendation">
            <strong>Best Format:</strong> <span className="format-badge">FLUX</span>
          </div>
          <p className="why">
            Uses DALL-E 3. Natural language descriptions work best.
            Free with Microsoft account.
          </p>
          <div className="tips">
            <strong>Tips:</strong>
            <ul>
              <li>✓ Complete sentences</li>
              <li>✓ Describe composition clearly</li>
              <li>✓ Include artistic style</li>
              <li>✓ Limited to 4 free generations</li>
            </ul>
          </div>
        </div>

        {/* Playground AI */}
        <div className="model-card">
          <h4>🎮 Playground AI</h4>
          <div className="recommendation">
            <strong>Best Format:</strong> <span className="format-badge">SDXL</span>
          </div>
          <p className="why">
            Based on Stable Diffusion XL. Weighted keywords and
            technical prompt syntax work very well.
          </p>
          <div className="tips">
            <strong>Tips:</strong>
            <ul>
              <li>✓ Use (keyword:1.2) weights</li>
              <li>✓ Quality tags: "masterpiece, best quality"</li>
              <li>✓ Negative prompts supported</li>
              <li>✓ Free tier: 500 images/day</li>
            </ul>
          </div>
        </div>

        {/* Stable Diffusion Online */}
        <div className="model-card">
          <h4>🌊 Stable Diffusion Online</h4>
          <div className="recommendation">
            <strong>Best Format:</strong> <span className="format-badge">SD1.5</span> or <span className="format-badge">SDXL</span>
          </div>
          <p className="why">
            Free SD implementations (clipdrop.co, stablediffusionweb.com).
            Use standard SD prompt format.
          </p>
          <div className="tips">
            <strong>Tips:</strong>
            <ul>
              <li>✓ Comma-separated keywords</li>
              <li>✓ Use negative prompts effectively</li>
              <li>✓ Keep under 77 tokens</li>
              <li>✓ Quality varies by service</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="quick-reference">
        <h4>📋 Quick Reference</h4>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Best Format</th>
              <th>Free Tier</th>
              <th>Style</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SORA / DALL-E 3</td>
              <td><strong>FLUX</strong></td>
              <td>Limited</td>
              <td>Natural language</td>
            </tr>
            <tr>
              <td>Google Gemini</td>
              <td><strong>FLUX</strong></td>
              <td>Yes</td>
              <td>Natural language</td>
            </tr>
            <tr>
              <td>Leonardo.AI</td>
              <td><strong>SDXL</strong></td>
              <td>150/day</td>
              <td>Weighted keywords</td>
            </tr>
            <tr>
              <td>Ideogram</td>
              <td><strong>FLUX</strong></td>
              <td>Yes</td>
              <td>Natural language</td>
            </tr>
            <tr>
              <td>Midjourney</td>
              <td><strong>FLUX</strong></td>
              <td>Trial only</td>
              <td>Mixed</td>
            </tr>
            <tr>
              <td>Bing Creator</td>
              <td><strong>FLUX</strong></td>
              <td>4/day</td>
              <td>Natural language</td>
            </tr>
            <tr>
              <td>Playground AI</td>
              <td><strong>SDXL</strong></td>
              <td>500/day</td>
              <td>Weighted keywords</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="general-tips">
        <h4>💡 General Tips for All Services</h4>
        <ul>
          <li><strong>Start with FLUX format</strong> if unsure - it works well everywhere</li>
          <li><strong>Use SDXL format</strong> for Stable Diffusion-based services</li>
          <li><strong>Copy the negative prompt</strong> when using SD-based models</li>
          <li><strong>Adjust based on results</strong> - some services are more lenient with syntax</li>
          <li><strong>Keep character descriptions clear</strong> regardless of format</li>
        </ul>
      </div>
    </div>
  );
}
