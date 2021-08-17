package jp.alhinc.calculate_sales.service;

import static org.junit.Assert.*;

import org.junit.Test;

import jp.alhinc.calculate_sales.TestHelper;

public class LoadDefinitionFileServiceTest {

	private static final Class<?> TEST_CLASS = LoadDefinitionFileService.class;
	private static final String METHOD_NAME_IS_CORRECT_LINE = "isCorrectLine";

	@Test
	public void testIsCorrectLine正しいフォーマットのときtrueを返す() {
 		assertEquals(true, TestHelper.run(TEST_CLASS, METHOD_NAME_IS_CORRECT_LINE, "001,東京支店"));
	}

	@Test
	public void testIsCorrectLine支店コードが2桁数字のときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectLine支店コードが4桁数字のときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectLine支店コードが数字以外を含む3桁のときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectLineカンマが連続するときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectLineカンマが2つ含まれるときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectLine末尾にカンマが含まれるときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectLine支店名が空文字のときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectLine文字列全体が空文字のときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectLine文字列全体が空のときfalseを返す() {
		assertEquals(false, TestHelper.run(TEST_CLASS, METHOD_NAME_IS_CORRECT_LINE, new Object[] {null}));
	}

	@Test
	public void testIsCorrectCodeFormat引数が001のときtrueを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectCodeFormat引数が01のときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectCodeFormat引数が0001のときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectCodeFormat引数が00aのときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectCodeFormat引数が空のときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectNameFormat引数がaのときtrueを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectNameFormat引数が空文字のときfalseを返す() {
		// TODO implements
	}

	@Test
	public void testIsCorrectNameFormat引数が空のときfalseを返す() {
		// TODO implements
	}
}
