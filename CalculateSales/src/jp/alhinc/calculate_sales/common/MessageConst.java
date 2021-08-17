package jp.alhinc.calculate_sales.common;

public interface MessageConst {
	
	public static final String ERROR_DEFINITION_FILE_ABSENCE = "支店定義ファイルが存在しません";
	public static final String ERROR_DEFINITION_FILE_MALFORMATTED = "支店定義ファイルのフォーマットが不正です";
	public static final String ERROR_SALES_FILE_MALFORMATTED = "%sのフォーマットが不正です";
	public static final String ERROR_BRANCH_ABSENCE = "%sの支店コードが不正です";
	public static final String ERROR_EXCEEDED_DIGIT = "合計金額が10桁を超えました";
	public static final String ERROR_OTHERS = "予期せぬエラーが発生しました";
}
