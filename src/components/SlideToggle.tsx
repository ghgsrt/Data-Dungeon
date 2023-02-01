function SlideToggle(props: any) {
	
    return (
		<label class="switch">
			<input
				type="checkbox"
				{...props}
			/>
			<span class="slider round" />
		</label>
	);
}

export default SlideToggle;
