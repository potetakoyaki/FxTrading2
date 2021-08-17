package jp.alhinc.calculate_sales.service;

import java.io.IOException;

import jp.alhinc.calculate_sales.bean.Branches;

public class LoadDefinitionFileService {

	/**
	 * 支店定義ファイルの存在有無を返却する
	 * 
	 * @param path
	 *            検索対象ディレクトリパス
	 * @return 支店定義ファイルの存在有無
	 */
	public static boolean existsBranchDefinitionFile(String path) {
		// TODO implements
		return false;
	}

	/**
	 * 支店定義ファイルの読み込み
	 * 
	 * @param path
	 *            検索対象ディレクトリパス
	 * @return 支店情報一覧
	 * @throws IOException
	 *             支店定義ファイル読み込みに失敗した場合
	 */
	public static Branches load(String path) throws IOException {
		// TODO implements
		return null;
	}

	/**
	 * 支店定義のフォーマットチェックを行う
	 * 
	 * @param line
	 *            支店定義行
	 * @return フォーマットの妥当性
	 */
	private static boolean isCorrectLine(String line) {
		// TODO implements
		return false;
	}

	/**
	 * 支店コードの妥当性チェックを行う
	 * 
	 * @param code
	 *            支店コード
	 * @return 支店コードの妥当性
	 */
	private static boolean isCorrectCodeFormat(String code) {
		// TODO implements
		return false;
	}

	/**
	 * 支店名の妥当性チェックを行う
	 * 
	 * @param name
	 *            支店名
	 * @return 支店名の妥当性
	 */
	private static boolean isCorrectNameFormat(String name) {
		// TODO implements
		return false;
	}
}
