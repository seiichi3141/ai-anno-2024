"""
ファイル管理ユーティリティ
一時ファイルの作成、削除、管理を担当
"""
import os
import time
from src.config import TEMP_DIR, FILE_CLEANUP_HOURS

# 一時ファイルの管理用ディレクトリを作成
os.makedirs(TEMP_DIR, exist_ok=True)

def cleanup_old_files():
    """指定時間以上経過した一時ファイルを削除する"""
    current_time = time.time()
    cleanup_seconds = FILE_CLEANUP_HOURS * 3600  # 時間を秒に変換
    
    for filename in os.listdir(TEMP_DIR):
        filepath = os.path.join(TEMP_DIR, filename)
        # ファイルの最終更新時間を取得
        file_mod_time = os.path.getmtime(filepath)
        # 指定時間以上経過していれば削除
        if current_time - file_mod_time > cleanup_seconds:
            try:
                os.remove(filepath)
                print(f"古いファイルを削除しました: {filename}")
            except Exception as e:
                print(f"ファイル削除中にエラーが発生しました: {e}")

def generate_filename(text: str, extension: str = "wav", prefix: str = "") -> str:
    """テキストからファイル名を生成する
    
    Args:
        text: ファイル名のベースとなるテキスト
        extension: ファイル拡張子
        prefix: ファイル名の接頭辞（デバッグ用など）
    """
    import os
    # テキストの最初の10文字をファイル名に使用
    base_name = text[:10].replace(' ', '_').replace('/', '_').replace('\\', '_')
    # ランダムな文字列を追加
    random_suffix = os.urandom(4).hex()
    return f"{prefix}{base_name}_{random_suffix}.{extension}"

def get_file_path(filename: str) -> str:
    """一時ディレクトリ内のファイルパスを取得する"""
    return os.path.join(TEMP_DIR, filename)
