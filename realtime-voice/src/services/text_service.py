"""
テキスト処理サービス
文の分割、解析などのテキスト関連処理を担当
"""
from typing import List
from functools import lru_cache
import spacy

@lru_cache(maxsize=1)
def load_nlp_model():
    """日本語解析用のGINZAモデルをロードする（初回のみ）"""
    try:
        print("GINZAモデル（ja_ginza_electra）をロード中...")
        nlp = spacy.load("ja_ginza_electra")
        print("GINZAモデルのロードが完了しました")
        return nlp
    except Exception as e:
        print(f"GINZAモデルのロードに失敗しました: {e}")
        print("GINZAモデルが見つからないため、シンプルな分割方法を使用します")
        return None

def split_text_into_sentences(text: str) -> List[str]:
    """
    テキストを文単位で分割する
    
    Parameters:
    - text: 分割するテキスト
    
    Returns:
    - 分割された文のリスト
    """
    nlp = load_nlp_model()
    
    if nlp is not None:
        # GINZAモデルが利用可能な場合はそれを使用
        doc = nlp(text)
        sentences = [sent.text for sent in doc.sents]
        return sentences
    else:
        # GINZAモデルが利用できない場合は簡易的な分割を行う
        # 句点（。）、感嘆符（！）、疑問符（？）で分割
        import re
        # 句読点の後ろに空白を挿入して分割しやすくする
        text = re.sub(r'([。！？])', r'\1\n', text)
        # 分割して空白行を削除
        sentences = [s.strip() for s in text.split('\n') if s.strip()]
        return sentences
