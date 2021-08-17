package jp.alhinc.calculate_sales.service;

import java.io.IOException;
import java.util.List;

import jp.alhinc.calculate_sales.bean.Branch;
import jp.alhinc.calculate_sales.bean.Branches;

public class SummaryService {
	
	/**
	 * 売上集計処理
	 * 
	 * @param path
	 *            ディレクトリパス
	 * @param branches
	 *            支店情報一覧
	 * @return 売上集計後の支店情報一覧
	 * @throws IOException
	 *             売上ファイル読み込みに失敗した場合
	 */
	public static Branches summarize(String path, Branches branches) throws IOException {
		// TODO implements
		return null;
	}

	/**
	 * 支店の存在チェックを行う
	 * 
	 * @param branches
	 *            支店情報一覧
	 * @param code
	 *            支店コード
	 * @return 支店の存在有無
	 */
	private static boolean isCorrectBranchCode(Branches branches, String code) {
		// TODO implements
		return false;
	}

	/**
	 * 金額の桁数チェックを行う
	 * 
	 * @param branch
	 *            支店情報
	 * @return 桁数が範囲内であるか
	 */
	private static boolean within10Digit(Branch branch) {
		// TODO implements
		return false;
	}

	/**
	 * 金額の妥当性チェックを行う
	 * 
	 * @param amount
	 *            金額
	 * @return 金額として妥当であるか
	 */
	private static boolean isCorrectAmount(String amount) {
		// TODO implements
		return false;
	}

	/**
	 * 売上ファイルのフォーマットチェック
	 * 
	 * @param rcdContents
	 *            売上ファイル内容
	 * @return 妥当なフォーマットであるか
	 */
	private static boolean isCorrectFormat(List<String> rcdContents) {
		// TODO implements
		return false;
	}

}
