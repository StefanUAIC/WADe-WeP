import os
import qrcode
import io
import base64
from typing import Dict

class QRCodeService:
    
    @staticmethod
    def generate_qr_code(article_id: str) -> str:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        url = f"{frontend_url}/articles/{article_id}"
        
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_base64}"
    
    @staticmethod
    def generate_qr_info(article_id: str) -> Dict:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        qr_data = QRCodeService.generate_qr_code(article_id)
        return {
            "article_id": article_id,
            "qr_code": qr_data,
            "url": f"{frontend_url}/articles/{article_id}"
        }
