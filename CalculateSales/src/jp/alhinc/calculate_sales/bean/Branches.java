package jp.alhinc.calculate_sales.bean;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Branches {

	/** エラーメッセージ */
	private String errorMessage;

	/** 支店情報マップ */
	private Map<String, Branch> branches;

	public Branches() {
		this.errorMessage = null;
		this.branches = new HashMap<>();
	}

	/**
	 * エラーメッセージを返す
	 *
	 * @return errorMessage エラーメッセージ
	 */
	public String getErrorMessage() {
		return errorMessage;
	}

	/**
	 * エラーメッセージをセットする
	 *
	 * @param errorMessage
	 *            エラーメッセージ
	 */
	public void setErrorMessage(String errorMessage) {
		this.errorMessage = errorMessage;
	}

	public void addBranch(Branch branch) {
		this.branches.put(branch.getCode(), branch);
	}

	/**
	 * エラー有無を返却する
	 * 
	 * @return エラー有無
	 */
	public boolean hasError() {
		return errorMessage != null;
	}

	/**
	 * 支店コードに合致する支店情報を取得する
	 * 
	 * @param code
	 *            支店コード
	 * @return 支店情報
	 */
	public Branch getBranch(String code) {
		return branches.get(code);
	}

	/**
	 * 全支店情報を取得する
	 * 
	 * @return 全支店情報
	 */
	public List<Branch> getBranchList() {
		return new ArrayList<>(branches.values());
	}

	/**
	 * 支店の存在有無を返却する
	 * 
	 * @param code
	 *            支店コード
	 * @return 支店の存在有無
	 */
	public boolean hasCode(String code) {
		return branches.containsKey(code);
	}

}
